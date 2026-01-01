interface TextDisplayProps {
  text: string;
  isFlipped?: boolean;
}

export function TextDisplay({ text, isFlipped = false }: TextDisplayProps) {
  return (
    <div
      className={`flex-1 flex items-center justify-center p-4 overflow-auto ${
        isFlipped ? 'bg-gray-800' : 'bg-gray-900'
      }`}
      style={{
        transform: isFlipped ? 'rotate(180deg)' : 'none',
      }}
    >
      <p
        className="text-white text-2xl md:text-4xl lg:text-5xl font-medium text-center leading-relaxed max-w-4xl"
        style={{ wordBreak: 'break-word' }}
      >
        {text || (
          <span className="text-gray-500 text-xl">
            {isFlipped ? '' : '點擊麥克風開始說話...'}
          </span>
        )}
      </p>
    </div>
  );
}

export default TextDisplay;
