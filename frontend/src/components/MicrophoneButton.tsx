interface MicrophoneButtonProps {
  isRecording: boolean;
  onClick: () => void;
  disabled?: boolean;
  volumeLevel?: number;
}

export function MicrophoneButton({
  isRecording,
  onClick,
  disabled = false,
  volumeLevel = 0,
}: MicrophoneButtonProps) {
  const pulseScale = 1 + volumeLevel * 0.3;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative w-20 h-20 rounded-full flex items-center justify-center
        transition-all duration-200 ease-in-out
        ${isRecording
          ? 'bg-red-500 hover:bg-red-600'
          : 'bg-blue-500 hover:bg-blue-600'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        focus:outline-none focus:ring-4 focus:ring-blue-300
      `}
      aria-label={isRecording ? 'Stop recording' : 'Start recording'}
    >
      {isRecording && (
        <div
          className="absolute inset-0 rounded-full bg-red-400 opacity-50 animate-ping"
          style={{
            transform: `scale(${pulseScale})`,
            animationDuration: '1.5s',
          }}
        />
      )}
      <svg
        className="w-10 h-10 text-white relative z-10"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        {isRecording ? (
          <rect x="6" y="6" width="12" height="12" rx="2" />
        ) : (
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1 1.93c-3.94-.49-7-3.85-7-7.93h2c0 3.31 2.69 6 6 6s6-2.69 6-6h2c0 4.08-3.06 7.44-7 7.93V19h4v2H8v-2h4v-3.07z" />
        )}
      </svg>
    </button>
  );
}

export default MicrophoneButton;
