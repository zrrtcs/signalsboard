import { useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import { useHospitalStore } from '../store/hospitalStore';
import type { VitalSignsUpdate, AlertNotification, NurseAttendingChange, InjectionModeChange } from '../types/hospital';

const HUB_URL = import.meta.env.VITE_HUB_URL || 'http://localhost:5001/hubs/vitals';

/**
 * Hospital-specific SignalR hook for real-time vital signs and alerts
 * Connects to VitalsHub and manages connection lifecycle
 */
export function useHospitalSignalR(notificationsEnabled: boolean = false) {
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const updatePatientVitals = useHospitalStore(state => state.updatePatientVitals);
  const addAlert = useHospitalStore(state => state.addAlert);
  const setConnectionStatus = useHospitalStore(state => state.setConnectionStatus);
  const connectionStatus = useHospitalStore(state => state.connectionStatus);

  useEffect(() => {
    // Skip if already connected or connecting
    if (connectionRef.current?.state === signalR.HubConnectionState.Connected ||
        connectionRef.current?.state === signalR.HubConnectionState.Connecting) {
      return;
    }

    // Define startConnection FIRST before using it
    const startConnection = async () => {
      try {
        // Guard: only start if connection is in disconnected state
        if (connectionRef.current?.state !== signalR.HubConnectionState.Disconnected) {
          console.log('⏭️ Connection not ready to start, skipping');
          return;
        }

        setConnectionStatus('connecting');
        await connectionRef.current!.start();
        console.log('✅ Connected to VitalsHub');
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;
      } catch (err) {
        console.error('❌ Connection failed:', err);
        setConnectionStatus('disconnected');

        // Retry with exponential backoff (only manual retries, SignalR handles auto-reconnect)
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const retryDelay = 1000 * Math.pow(2, reconnectAttemptsRef.current);
          console.log(`🔄 Retrying in ${retryDelay}ms (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`);
          reconnectAttemptsRef.current++;
          setTimeout(() => startConnection(), retryDelay);
        } else {
          console.error('❌ Max reconnect attempts reached.');
        }
      }
    };

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect([0, 1000, 2000, 5000, 10000])
      .configureLogging(signalR.LogLevel.Information)
      .build();

    connectionRef.current = connection;

    // Subscribe to VitalsHub events
    connection.on('ReceiveVitalUpdate', (update: VitalSignsUpdate) => {
      console.log('📊 Vital update:', update);
      updatePatientVitals(update);
    });

    connection.on('ReceiveAlert', (alert: AlertNotification) => {
      console.log('🚨 Alert:', alert);
      addAlert(alert);

      // Browser notification for critical alerts (only if user enabled notifications)
      if (notificationsEnabled && alert.severity === 'Critical' && Notification.permission === 'granted') {
        new Notification(`Critical: ${alert.patientName}`, {
          body: alert.message,
          tag: alert.alertId,
        });
      }
    });

    connection.on('ReceiveInjectionModeChange', (change: InjectionModeChange) => {
      console.log('💉 Injection mode change:', change);
      // Update Zustand store with new injection mode state
      useHospitalStore.getState().toggleInjectionMode(change.patientId, change.injectionModeEnabled);
    });

    connection.on('ReceiveNurseAttendingChange', (change: NurseAttendingChange) => {
      console.log('👨‍⚕️ Nurse attending change:', change);
      // Update Zustand store with new nurse attending state
      useHospitalStore.getState().setNurseAttending(change.nurseAttending ? change.patientId : undefined);
    });

    // Connection lifecycle events
    connection.onreconnecting(() => {
      console.log('🔄 Reconnecting...');
      setConnectionStatus('reconnecting');
    });

    connection.onreconnected(() => {
      console.log('✅ Reconnected automatically');
      setConnectionStatus('connected');
      reconnectAttemptsRef.current = 0;
    });

    connection.onclose((error) => {
      console.error('❌ Connection closed:', error);
      setConnectionStatus('disconnected');
    });

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Start connection
    startConnection();

    return () => {
      if (connection.state !== signalR.HubConnectionState.Disconnected) {
        connection.stop();
      }
    };
  }, [notificationsEnabled]);

  return {
    connectionStatus,
    connection: connectionRef.current,
  };
}