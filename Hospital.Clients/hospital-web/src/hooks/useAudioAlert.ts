import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useHospitalStore } from '../store/hospitalStore';

/**
 * Custom hook for managing emergency audio alerts
 * Plays an emergency break sound when a patient reaches CRITICAL status
 * Respects per-patient mute settings and global mute toggle, persisted to localStorage
 */
export function useAudioAlert() {
  // Map of patient ID to their own audio element for concurrent playback
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const sirenBlobRef = useRef<Blob | null>(null);
  const mutedPatientsRef = useRef<Set<string>>(new Set());
  const playingPatientsRef = useRef<Set<string>>(new Set());
  const globalMuteRef = useRef<boolean>(false);

  // Get patients from store - will trigger on any change
  const patientsMap = useHospitalStore(state => state.patients);

  // Memoize critical patient IDs to avoid infinite loops
  // Only recalculates when the actual critical set changes
  const criticalPatientIds = useMemo(() => {
    const patients = Array.from(patientsMap.values());
    return patients
      .filter(p => p.status === 'critical')
      .map(p => p.id)
      .sort(); // Sort for consistent comparison
  }, [patientsMap]);

  // Initialize muted patients and global mute from localStorage
  useEffect(() => {
    // Load per-patient mutes
    const stored = localStorage.getItem('hospital:muted-patients');
    if (stored) {
      try {
        const muted = JSON.parse(stored);
        mutedPatientsRef.current = new Set(muted);
      } catch (e) {
        console.error('Failed to parse muted patients from localStorage:', e);
      }
    }

    // Load global mute setting (default: true, meaning audio is MUTED/disabled)
    // This ensures audio alerts don't surprise users on first load
    const globalMute = localStorage.getItem('hospital:global-mute');
    globalMuteRef.current = globalMute ? JSON.parse(globalMute) : true;
  }, []);

  // Generate siren blob once on mount
  useEffect(() => {
    if (!sirenBlobRef.current) {
      const generateSiren = () => {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const duration = 2; // 2-second siren pattern
        const sampleRate = audioContext.sampleRate;
        const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);

        // Generate a two-tone siren pattern
        for (let i = 0; i < buffer.length; i++) {
          const t = i / sampleRate;
          const freq1 = 800; // Low tone
          const freq2 = 1200; // High tone
          const freq = (Math.floor(t * 2) % 2 === 0) ? freq1 : freq2;
          const angle = (freq * Math.PI * 2 * t) % (Math.PI * 2);
          data[i] = Math.sin(angle) * 0.3;
        }
        return buffer;
      };

      const buffer = generateSiren();
      const wav = bufferToWav(buffer);
      sirenBlobRef.current = new Blob([wav], { type: 'audio/wav' });
    }
  }, []);

  // Helper function to convert AudioBuffer to WAV format
  const bufferToWav = (buffer: AudioBuffer): ArrayBuffer => {
    const length = buffer.length * buffer.numberOfChannels * 2 + 44;
    const arrayBuffer = new ArrayBuffer(length);
    const view = new DataView(arrayBuffer);
    const channels = [];
    let offset = 0;
    let pos = 44;

    // Write WAV header
    const setUint16 = (data: number) => {
      view.setUint16(offset, data, true);
      offset += 2;
    };

    const setUint32 = (data: number) => {
      view.setUint32(offset, data, true);
      offset += 4;
    };

    // RIFF identifier
    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"

    // fmt sub-chunk
    setUint32(0x20746d66); // "fmt "
    setUint32(16); // chunkSize
    setUint16(1); // audioFormat (PCM)
    setUint16(buffer.numberOfChannels);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * buffer.numberOfChannels);
    setUint16(buffer.numberOfChannels * 2);
    setUint16(16); // bitsPerSample

    // data sub-chunk
    offset = 36;
    setUint32(0x61746164); // "data"
    setUint32(length - pos);

    // Convert Float32 to PCM
    const volume = 0.8;
    for (let i = 0; i < buffer.numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }

    while (pos < length) {
      for (let i = 0; i < buffer.numberOfChannels; i++) {
        let sample = Math.max(-1, Math.min(1, channels[i][pos - 44]));
        sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(pos, sample * volume, true);
        pos += 2;
      }
    }

    return arrayBuffer;
  };

  // Play emergency siren for critical patient (concurrent support)
  const playEmergencyAlert = useCallback(async (patientId: string) => {
    // Check global mute first
    if (globalMuteRef.current) {
      console.log(`🔇 Global audio mute enabled, skipping alert for patient ${patientId}`);
      return;
    }

    // Check patient-specific mute
    if (mutedPatientsRef.current.has(patientId)) {
      console.log(`🔇 Patient ${patientId} is muted, skipping audio alert`);
      return;
    }

    if (!sirenBlobRef.current) return;

    try {
      // Only play if not already playing for this patient
      if (!playingPatientsRef.current.has(patientId)) {
        // Create a new audio element for this patient
        let audioElement = audioElementsRef.current.get(patientId);
        if (!audioElement) {
          audioElement = new Audio();
          // Create a unique blob URL for each patient's audio element
          // This ensures multiple audio elements don't interfere with each other
          audioElement.src = URL.createObjectURL(sirenBlobRef.current);
          audioElement.loop = true;
          audioElement.volume = 0.8; // Set volume to avoid distortion
          audioElementsRef.current.set(patientId, audioElement);
        }

        playingPatientsRef.current.add(patientId);
        // Ensure the audio element is ready before playing
        audioElement.currentTime = 0;
        const playPromise = audioElement.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error(`Failed to play audio for patient ${patientId}:`, error);
          });
        }
        console.log(`🚨 Emergency alert: Patient ${patientId}`);
      }
    } catch (error) {
      console.error('Failed to play emergency alert:', error);
    }
  }, []);

  // Stop emergency siren for patient
  const stopEmergencyAlert = useCallback((patientId: string) => {
    const audioElement = audioElementsRef.current.get(patientId);
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }

    playingPatientsRef.current.delete(patientId);
    console.log(`⏹️ Emergency alert stopped for patient ${patientId}`);
  }, []);

  // Toggle mute for a patient
  const togglePatientMute = useCallback((patientId: string) => {
    const isMuted = mutedPatientsRef.current.has(patientId);

    if (isMuted) {
      // Unmuting: remove from muted set
      mutedPatientsRef.current.delete(patientId);
      console.log(`🔊 Patient ${patientId} audio unmuted`);
    } else {
      // Muting: add to muted set AND stop audio immediately
      mutedPatientsRef.current.add(patientId);

      // Stop audio immediately if it's currently playing
      const audioElement = audioElementsRef.current.get(patientId);
      if (audioElement && !audioElement.paused) {
        audioElement.pause();
        audioElement.currentTime = 0;
        console.log(`🔇 Patient ${patientId} audio muted - stopping playback`);
      } else {
        console.log(`🔇 Patient ${patientId} audio muted`);
      }
    }

    // Persist to localStorage
    localStorage.setItem(
      'hospital:muted-patients',
      JSON.stringify(Array.from(mutedPatientsRef.current))
    );
  }, []);

  // Check if patient is muted
  const isPatientMuted = useCallback((patientId: string): boolean => {
    return mutedPatientsRef.current.has(patientId);
  }, []);

  // Toggle global mute for all patients
  const toggleGlobalMute = useCallback(() => {
    globalMuteRef.current = !globalMuteRef.current;

    // Persist to localStorage
    localStorage.setItem('hospital:global-mute', JSON.stringify(globalMuteRef.current));

    if (globalMuteRef.current) {
      // Global mute enabled: stop all patient audio elements
      audioElementsRef.current.forEach(audioElement => {
        audioElement.pause();
        audioElement.currentTime = 0;
      });
      console.log('🔇 Global audio MUTED - all patient alarms silenced');
    } else {
      // Global mute disabled: could re-play if still critical
      console.log('🔊 Global audio UNMUTED - patient alarms enabled');
    }
  }, []);

  // Check if global mute is enabled
  const isGloballyMuted = useCallback((): boolean => {
    return globalMuteRef.current;
  }, []);

  // Monitor patient statuses and trigger/stop audio as needed
  useEffect(() => {
    const currentCriticalIds = new Set(criticalPatientIds);
    const previousCriticalIds = new Set(playingPatientsRef.current);

    // Play alerts for newly critical patients
    currentCriticalIds.forEach(patientId => {
      if (!previousCriticalIds.has(patientId)) {
        playEmergencyAlert(patientId);
      }
    });

    // Stop alerts for patients no longer critical
    previousCriticalIds.forEach(patientId => {
      if (!currentCriticalIds.has(patientId)) {
        stopEmergencyAlert(patientId);
      }
    });
  }, [criticalPatientIds, playEmergencyAlert, stopEmergencyAlert]);

  // Monitor mute changes and stop audio for muted patients
  useEffect(() => {
    if (playingPatientsRef.current.size > 0) {
      // Check each playing patient and stop if they're now muted
      playingPatientsRef.current.forEach(patientId => {
        const isPatientMuted = mutedPatientsRef.current.has(patientId);
        const isGlobalMuted = globalMuteRef.current;

        // If patient is muted or global mute is on, stop their audio
        if (isPatientMuted || isGlobalMuted) {
          const audioElement = audioElementsRef.current.get(patientId);
          if (audioElement && !audioElement.paused) {
            audioElement.pause();
            audioElement.currentTime = 0;
            console.log(`🔇 Muted audio for patient ${patientId}`);
          }
        }
      });
    }
  });

  return {
    togglePatientMute,
    isPatientMuted,
    toggleGlobalMute,
    isGloballyMuted,
  };
}