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


class BreezeASRService(ASRService):
    """
    Real ASR service using Breeze-ASR-25.
    GitHub: https://github.com/mtkresearch/Breeze-ASR-25
    """

    def __init__(self, model_name: str = "MediaTek-Research/Breeze-ASR-25"):
        self.model_name = model_name
        self._model = None
        self._processor = None
        self._initialized = False

    async def initialize(self) -> None:
        if self._initialized:
            return

        logger.info(f"Initializing Breeze-ASR-25: {self.model_name}")

        try:
            import torch
            from transformers import AutoModelForSpeechSeq2Seq, AutoProcessor

            device = "cuda" if torch.cuda.is_available() else "cpu"
            torch_dtype = torch.float16 if torch.cuda.is_available() else torch.float32

            self._processor = AutoProcessor.from_pretrained(self.model_name)
            self._model = AutoModelForSpeechSeq2Seq.from_pretrained(
                self.model_name,
                torch_dtype=torch_dtype,
                low_cpu_mem_usage=True,
            ).to(device)

            self._device = device
            self._torch_dtype = torch_dtype
            self._initialized = True

            logger.info("Breeze-ASR-25 initialized successfully")

        except ImportError as e:
            logger.error(f"Missing packages: {e}")
            raise
        except Exception as e:
            logger.error(f"Failed to initialize: {e}")
            raise

    async def transcribe(self, audio_data: bytes) -> TranscriptionResult:
        if not self._initialized:
            await self.initialize()

        import torch
        import numpy as np

        # 解碼音訊（從 WebM 轉 PCM）
        pcm_data = decode_audio(audio_data)

        audio_array = np.frombuffer(pcm_data, dtype=np.int16).astype(np.float32)
        audio_array = audio_array / 32768.0

        # 檢查是否有足夠的音訊數據
        if len(audio_array) < 1600:  # 至少 0.1 秒
            return TranscriptionResult(text="", is_final=False)

        inputs = self._processor(
            audio_array, sampling_rate=16000, return_tensors="pt"
        ).to(self._device)

        with torch.no_grad():
            generated_ids = self._model.generate(
                inputs.input_features, max_new_tokens=256
            )

        transcription = self._processor.batch_decode(
            generated_ids, skip_special_tokens=True
        )[0]

        return TranscriptionResult(text=transcription.strip(), is_final=True, confidence=0.9)

    async def reset(self) -> None:
        logger.info("Breeze-ASR-25 state reset")


def create_asr_service(use_mock: bool = True) -> ASRService:
    if use_mock:
        logger.info("Creating Mock ASR Service")
        return MockASRService()
    else:
        logger.info("Creating Breeze-ASR-25 Service")
        return BreezeASRService()
