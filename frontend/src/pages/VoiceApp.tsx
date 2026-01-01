import { useEffect, useCallback } from 'react';
import { TextDisplay } from '../components/TextDisplay';
import { ControlBar } from '../components/ControlBar';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAudioRecorder } from '../hooks/useAudioRecorder';

function VoiceApp() {
  const {
    isConnected,
    sendAudio,
    transcript,
    connect,
    clearTranscript,
  } = useWebSocket();

  const {
    isRecording,
    startRecording,
    stopRecording,
    onAudioData,
    volumeLevel,
  } = useAudioRecorder();

  // Set up audio data callback
  useEffect(() => {
    onAudioData((data) => {
      if (isConnected) {
        sendAudio(data);
      }
    });
  }, [onAudioData, sendAudio, isConnected]);

  const handleMicrophoneClick = useCallback(async () => {
    if (isRecording) {
      stopRecording();
      // 不立刻斷開連線，讓辨識結果可以繼續返回
      // WebSocket 會保持連線接收結果
    } else {
      try {
        if (!isConnected) {
          connect();
        }
        await startRecording();
      } catch (error) {
        console.error('Failed to start recording:', error);
      }
    }
  }, [isRecording, isConnected, startRecording, stopRecording, connect]);

  const handleClearClick = useCallback(() => {
    clearTranscript();
  }, [clearTranscript]);

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Top half - flipped for person across */}
      <TextDisplay text={transcript} isFlipped={true} />

      {/* Divider */}
      <div className="h-px bg-gray-600" />

      {/* Bottom half - normal for self */}
      <TextDisplay text={transcript} isFlipped={false} />

      {/* Control bar */}
      <ControlBar
        isRecording={isRecording}
        onMicrophoneClick={handleMicrophoneClick}
        onClearClick={handleClearClick}
        volumeLevel={volumeLevel}
        isConnected={isConnected}
      />
    </div>
  );
}

export default VoiceApp;
