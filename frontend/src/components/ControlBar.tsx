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
  return (
    <div className="bg-gray-700 py-4 px-6 flex items-center justify-center gap-6 border-t border-gray-600">
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
