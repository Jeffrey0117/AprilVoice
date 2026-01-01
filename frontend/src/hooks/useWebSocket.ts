import { useState, useCallback, useRef, useEffect } from 'react';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

interface UseWebSocketOptions {
  url?: string;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onTranscript?: (text: string, isFinal: boolean) => void;
}

export interface UseWebSocketReturn {
  isConnected: boolean;
  connectionStatus: ConnectionStatus;
  sendAudio: (audioData: ArrayBuffer) => void;
  transcript: string;
  connect: () => void;
  disconnect: () => void;
  clearTranscript: () => void;
}

const DEFAULT_WS_URL = 'ws://localhost:8000/ws/transcribe';

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const {
    url = DEFAULT_WS_URL,
    autoReconnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    onTranscript,
  } = options;

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [transcript, setTranscript] = useState<string>('');

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isManualDisconnectRef = useRef<boolean>(false);

  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const disconnect = useCallback(() => {
    isManualDisconnectRef.current = true;
    clearReconnectTimeout();
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }
    setConnectionStatus('disconnected');
    reconnectAttemptsRef.current = 0;
  }, [clearReconnectTimeout]);

  const connect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    isManualDisconnectRef.current = false;
    setConnectionStatus('connecting');

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;
      };

      ws.onclose = () => {
        setConnectionStatus('disconnected');
        if (!isManualDisconnectRef.current && autoReconnect) {
          if (reconnectAttemptsRef.current < maxReconnectAttempts) {
            setConnectionStatus('reconnecting');
            reconnectAttemptsRef.current += 1;
            reconnectTimeoutRef.current = setTimeout(() => {
              connect();
            }, reconnectInterval);
          }
        }
      };

      ws.onmessage = (event) => {
        try {
          console.log('WebSocket received:', event.data);
          const message = JSON.parse(event.data);
          if (message.type === 'transcript') {
            console.log('Transcript received:', message.text, 'is_final:', message.is_final);
            if (message.is_final) {
              setTranscript((prev) => {
                const newText = prev ? `${prev} ${message.text}` : message.text;
                console.log('Updated transcript:', newText);
                return newText;
              });
            }
            onTranscript?.(message.text, message.is_final);
          }
        } catch (e) {
          console.error('Failed to parse message:', e);
        }
      };
    } catch (e) {
      setConnectionStatus('disconnected');
      console.error('WebSocket connection error:', e);
    }
  }, [url, autoReconnect, reconnectInterval, maxReconnectAttempts, onTranscript]);

  const sendAudio = useCallback((audioData: ArrayBuffer) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const uint8Array = new Uint8Array(audioData);
      let binary = '';
      for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      const base64Audio = btoa(binary);
      wsRef.current.send(JSON.stringify({ type: 'audio', data: base64Audio }));
    }
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  useEffect(() => {
    return () => {
      isManualDisconnectRef.current = true;
      clearReconnectTimeout();
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [clearReconnectTimeout]);

  return {
    isConnected: connectionStatus === 'connected',
    connectionStatus,
    sendAudio,
    transcript,
    connect,
    disconnect,
    clearTranscript,
  };
}

export default useWebSocket;
