import { useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import { useHospitalStore } from '../store/hospitalStore';
import type { VitalSignsUpdate, AlertNotification } from '../types/hospital';

const HUB_URL = import.meta.env.VITE_HUB_URL || 'http://localhost:5001/hubs/vitals';

/**
 * Hospital-specific SignalR hook for real-time vital signs and alerts
 * Connects to VitalsHub and manages connection lifecycle
 */
export function useHospitalSignalR() {
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const updatePatientVitals = useHospitalStore(state => state.updatePatientVitals);
  const addAlert = useHospitalStore(state => state.addAlert);
  const setConnectionStatus = useHospitalStore(state => state.setConnectionStatus);
  const connectionStatus = useHospitalStore(state => state.connectionStatus);

  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        skipNegotiation: false,
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          // Exponential backoff: 1s, 2s, 4s, 8s, 16s
          const delay = Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 16000);
          console.log(`Reconnecting in ${delay}ms (attempt ${retryContext.previousRetryCount + 1})`);
          return delay;
        }
      })
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

      // Browser notification for critical alerts
      if (alert.severity === 'Critical' && Notification.permission === 'granted') {
        new Notification(`Critical: ${alert.patientName}`, {
          body: alert.message,
          tag: alert.alertId,
        });
      }
    });

    // Connection lifecycle
    connection.onreconnecting(() => {
      console.log('🔄 Reconnecting...');
      setConnectionStatus('reconnecting');
    });

    connection.onreconnected(() => {
      console.log('✅ Reconnected');
      setConnectionStatus('connected');
      reconnectAttemptsRef.current = 0;
    });

    connection.onclose((error) => {
      console.error('❌ Connection closed:', error);
      setConnectionStatus('disconnected');

      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        setTimeout(() => startConnection(), 5000);
        reconnectAttemptsRef.current++;
      }
    });

    const startConnection = async () => {
      try {
        setConnectionStatus('connecting');
        await connection.start();
        console.log('✅ Connected to VitalsHub');
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;
      } catch (err) {
        console.error('❌ Connection failed:', err);
        setConnectionStatus('disconnected');

        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          setTimeout(() => startConnection(), 3000);
          reconnectAttemptsRef.current++;
        }
      }
    };

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    startConnection();

    return () => {
      connection.stop();
    };
  }, []);

  return {
    connectionStatus,
    connection: connectionRef.current,
  };
}