import { useState, useEffect } from 'react';
import { MicrophoneButton } from './MicrophoneButton';

interface ControlBarProps {
  isRecording: boolean;
  onMicrophoneClick: () => void;
  onClearClick: () => void;
  disabled?: boolean;
  volumeLevel?: number;
  isConnected?: boolean;
}

export function ControlBar({
  isRecording,
  onMicrophoneClick,
  onClearClick,
  disabled = false,
  volumeLevel = 0,
  isConnected = false,
}: ControlBarProps) {
  const [asrMode, setAsrMode] = useState<'local' | 'cloud'>('local');
  const [isLoading, setIsLoading] = useState(false);

  // 載入目前模式
  useEffect(() => {
    fetch('http://localhost:8000/asr/mode')
      .then(res => res.json())
      .then(data => setAsrMode(data.mode))
      .catch(() => {});
  }, []);

  const toggleMode = async () => {
    const newMode = asrMode === 'local' ? 'cloud' : 'local';
    setIsLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/asr/mode/${newMode}`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setAsrMode(newMode);
      } else {
        alert(data.error || 'Failed to switch mode');
      }
    } catch (e) {
      alert('Failed to connect to server');
    }
    setIsLoading(false);
  };

  return (
    <div className="bg-gray-700 py-4 px-6 flex items-center justify-center gap-4 border-t border-gray-600">
      {/* ASR Mode Toggle */}
      <button
        onClick={toggleMode}
        disabled={isLoading || isRecording}
        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          asrMode === 'cloud'
            ? 'bg-blue-600 hover:bg-blue-500 text-white'
            : 'bg-gray-600 hover:bg-gray-500 text-gray-200'
        } ${(isLoading || isRecording) ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={asrMode === 'cloud' ? 'Using Gemini API' : 'Using local Whisper'}
      >
        {isLoading ? '...' : asrMode === 'cloud' ? 'Cloud' : 'Local'}
      </button>

      <button
        onClick={onClearClick}
        className="w-14 h-14 rounded-full bg-gray-600 hover:bg-gray-500 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
        aria-label="Clear text"
      >
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>

      <MicrophoneButton
        isRecording={isRecording}
        onClick={onMicrophoneClick}
        disabled={disabled}
        volumeLevel={volumeLevel}
      />

      <div className="w-14 h-14 flex items-center justify-center">
        <div
          className={`w-3 h-3 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`}
          title={isConnected ? 'Connected' : 'Disconnected'}
        />
      </div>
    </div>
  );
}

export default ControlBar;
