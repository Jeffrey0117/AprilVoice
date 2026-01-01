"""
ASR Service for AprilVoice
Integrates with Breeze-ASR-25 for Chinese speech recognition.
"""

import asyncio
import io
import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass

logger = logging.getLogger(__name__)


def decode_audio(audio_data: bytes) -> bytes:
    """將 WebM/Opus 音訊轉換為 PCM 16-bit 16kHz mono"""
    import subprocess
    import tempfile
    import os

    try:
        # 寫入暫存檔，因為 ffmpeg pipe 無法識別 webm 格式
        with tempfile.NamedTemporaryFile(suffix='.webm', delete=False) as f:
            f.write(audio_data)
            input_path = f.name

        try:
            result = subprocess.run(
                [
                    'ffmpeg', '-y', '-hide_banner', '-loglevel', 'error',
                    '-i', input_path,
                    '-f', 's16le', '-acodec', 'pcm_s16le',
                    '-ar', '16000', '-ac', '1',
                    'pipe:1'
                ],
                capture_output=True,
                timeout=10
            )

            if result.returncode == 0 and result.stdout:
                logger.info(f"Audio decoded: {len(audio_data)} -> {len(result.stdout)} bytes")
                return result.stdout
            else:
                logger.warning(f"ffmpeg error: {result.stderr.decode()[:200]}")
                return audio_data
        finally:
            os.unlink(input_path)

    except Exception as e:
        logger.warning(f"Audio decode failed: {e}")
        return audio_data


@dataclass
class TranscriptionResult:
    text: str
    is_final: bool
    confidence: float = 1.0


class ASRService(ABC):
    @abstractmethod
    async def initialize(self) -> None:
        pass

    @abstractmethod
    async def transcribe(self, audio_data: bytes) -> TranscriptionResult:
        pass

    @abstractmethod
    async def reset(self) -> None:
        pass


class MockASRService(ASRService):
    """Mock ASR service for development and testing."""

    def __init__(self):
        self._initialized = False
        self._mock_responses = [
            "你好",
            "今天天氣很好",
            "謝謝你的幫助",
            "我正在測試語音辨識",
            "這是一個測試",
            "語音轉文字功能正常運作",
        ]
        self._response_index = 0

    async def initialize(self) -> None:
        logger.info("Initializing Mock ASR Service...")
        await asyncio.sleep(0.1)
        self._initialized = True
        logger.info("Mock ASR Service initialized")

    async def transcribe(self, audio_data: bytes) -> TranscriptionResult:
        if not self._initialized:
            await self.initialize()

        # Simulate processing time
        await asyncio.sleep(0.1)

        response = self._mock_responses[self._response_index % len(self._mock_responses)]
        self._response_index += 1

        return TranscriptionResult(text=response, is_final=True, confidence=0.95)

    async def reset(self) -> None:
        logger.info("Mock ASR Service state reset")


class FasterWhisperService(ASRService):
    """
    Optimized ASR using faster-whisper with CTranslate2.
    4x faster than standard Whisper on CPU.
    """

    def __init__(self, model_size: str = "base"):
        # 可選: tiny, base, small, medium, large-v3
        # tiny: 最快但較不準確
        # base: 平衡速度與準確度 (推薦 CPU)
        # small: 更準確但較慢
        self.model_size = model_size
        self._model = None
        self._initialized = False

    async def initialize(self) -> None:
        if self._initialized:
            return

        logger.info(f"Initializing faster-whisper ({self.model_size})...")

        try:
            from faster_whisper import WhisperModel

            # CPU 最佳化設定
            self._model = WhisperModel(
                self.model_size,
                device="cpu",
                compute_type="int8",  # int8 量化，CPU 上更快
                cpu_threads=4,
            )

            self._initialized = True
            logger.info(f"faster-whisper ({self.model_size}) initialized")

        except ImportError as e:
            logger.error(f"Missing faster-whisper: {e}")
            raise
        except Exception as e:
            logger.error(f"Failed to initialize: {e}")
            raise

    async def transcribe(self, audio_data: bytes) -> TranscriptionResult:
        if not self._initialized:
            await self.initialize()

        import numpy as np

        # 解碼音訊（從 WebM 轉 PCM）
        pcm_data = decode_audio(audio_data)

        audio_array = np.frombuffer(pcm_data, dtype=np.int16).astype(np.float32)
        audio_array = audio_array / 32768.0

        # 檢查是否有足夠的音訊數據
        if len(audio_array) < 1600:  # 至少 0.1 秒
            return TranscriptionResult(text="", is_final=False)

        # faster-whisper 辨識 - 優化速度
        segments, info = self._model.transcribe(
            audio_array,
            language="zh",  # 中文
            beam_size=1,    # 最快速度 (greedy decoding)
            vad_filter=True,  # 開啟 VAD 過濾靜音
            vad_parameters={
                "min_silence_duration_ms": 300,
                "speech_pad_ms": 50,
                "threshold": 0.5,
            },
            condition_on_previous_text=False,  # 防止幻覺
            no_speech_threshold=0.5,
        )

        # 收集所有段落的文字
        text_parts = []
        for segment in segments:
            text_parts.append(segment.text)

        transcription = "".join(text_parts).strip()

        # 記錄原始辨識結果
        logger.info(f"Raw transcription: '{transcription}' (len={len(transcription)})")

        # 如果沒有文字，直接返回
        if not transcription:
            return TranscriptionResult(text="", is_final=True, confidence=0.0)

        # 只過濾最明顯的幻覺（暫時簡化過濾器）
        hallucination_patterns = [
            "MING PAO", "wordpress.com",
            "thank you for watching", "please subscribe",
        ]
        lower_text = transcription.lower()

        for pattern in hallucination_patterns:
            if pattern.lower() in lower_text:
                logger.warning(f"Filtered hallucination: '{transcription}'")
                return TranscriptionResult(text="", is_final=True, confidence=0.0)

        logger.info(f"Returning transcription: '{transcription}'")
        return TranscriptionResult(text=transcription, is_final=True, confidence=0.9)

    async def reset(self) -> None:
        logger.info("faster-whisper state reset")


def create_asr_service(use_mock: bool = False) -> ASRService:
    """
    創建 ASR 服務。
    use_mock=True: 使用假的辨識服務
    use_mock=False: 使用 faster-whisper (預設，CPU 上快 4 倍)
    """
    if use_mock:
        logger.info("Creating Mock ASR Service")
        return MockASRService()
    else:
        logger.info("Creating faster-whisper Service")
        # tiny: 最快 (~0.5秒) - 準確度較低
        # base: 較快 (~1秒) - 平衡選擇
        # small: 較準確 (~2-3秒) - 推薦 CPU
        # medium: 更準確 (~10-15秒) - CPU 太慢
        # large-v3: 最準確 (~20+秒) - CPU 極慢
        return FasterWhisperService(model_size="small")
