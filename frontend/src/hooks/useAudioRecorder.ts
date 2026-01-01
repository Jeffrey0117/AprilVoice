import { useState, useCallback, useRef, useEffect } from 'react';

export type RecordingStatus = 'idle' | 'requesting' | 'recording' | 'error';

export interface UseAudioRecorderReturn {
  isRecording: boolean;
  recordingStatus: RecordingStatus;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  onAudioData: (callback: (data: ArrayBuffer) => void) => void;
  error: string | null;
  volumeLevel: number;
}

function getSupportedMimeType(): string {
  const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
  for (const mimeType of mimeTypes) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType;
    }
  }
  return '';
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [volumeLevel, setVolumeLevel] = useState<number>(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCallbackRef = useRef<((data: ArrayBuffer) => void) | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const onAudioData = useCallback((callback: (data: ArrayBuffer) => void) => {
    audioCallbackRef.current = callback;
  }, []);

  const analyzeVolume = useCallback(() => {
    if (!analyserRef.current) return;
    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    setVolumeLevel(average / 255);
    if (recordingStatus === 'recording') {
      animationFrameRef.current = requestAnimationFrame(analyzeVolume);
    }
  }, [recordingStatus]);

  const cleanupResources = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (mediaRecorderRef.current) {
      // 清理 interval
      const intervalId = (mediaRecorderRef.current as any)._intervalId;
      if (intervalId) {
        clearInterval(intervalId);
      }
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    }
    mediaRecorderRef.current = null;
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setVolumeLevel(0);
  }, []);

  const startRecording = useCallback(async (): Promise<void> => {
    try {
      setRecordingStatus('requesting');
      setError(null);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser does not support audio recording');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      mediaStreamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mimeType = getSupportedMimeType();
      if (!mimeType) {
        throw new Error('No supported audio format');
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      // 累積音訊 chunks
      let audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (audioChunks.length > 0 && audioCallbackRef.current) {
          // 合併所有 chunks 成完整的 WebM
          const blob = new Blob(audioChunks, { type: mimeType });
          const arrayBuffer = await blob.arrayBuffer();
          audioCallbackRef.current(arrayBuffer);
          audioChunks = [];
        }
      };

      // 每 1.5 秒停止並重啟錄音，產生完整的 WebM
      const recordingInterval = setInterval(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
          mediaRecorder.start();
        }
      }, 1500);

      // 儲存 interval ID 以便清理
      (mediaRecorder as any)._intervalId = recordingInterval;

      mediaRecorder.start();
      setRecordingStatus('recording');
      analyzeVolume();
    } catch (err) {
      cleanupResources();
      const errorObj = err as Error;
      setError(errorObj.message || 'Recording failed');
      setRecordingStatus('error');
      throw err;
    }
  }, [cleanupResources, analyzeVolume]);

  const stopRecording = useCallback(() => {
    cleanupResources();
    setRecordingStatus('idle');
  }, [cleanupResources]);

  useEffect(() => {
    return () => {
      cleanupResources();
    };
  }, [cleanupResources]);

  return {
    isRecording: recordingStatus === 'recording',
    recordingStatus,
    startRecording,
    stopRecording,
    onAudioData,
    error,
    volumeLevel,
  };
}

export default useAudioRecorder;
