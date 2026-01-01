"""
Cloud ASR Services for AprilVoice
Supports Azure, Google Cloud, and OpenAI Whisper APIs with multi-account rotation.
"""

import asyncio
import base64
import json
import logging
import os
import tempfile
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

from asr_service import ASRService, TranscriptionResult, decode_audio

logger = logging.getLogger(__name__)


@dataclass
class AccountCredentials:
    """單一帳號的認證資訊"""
    name: str
    api_key: str
    region: str = ""  # Azure 需要
    project_id: str = ""  # Google 需要
    used_minutes: float = 0.0
    monthly_limit: float = 0.0  # 0 = 無限制
    last_reset: datetime = field(default_factory=datetime.now)
    enabled: bool = True


@dataclass
class AccountPool:
    """帳號池，支援多帳號輪換"""
    accounts: list[AccountCredentials] = field(default_factory=list)
    current_index: int = 0

    def add_account(self, account: AccountCredentials):
        self.accounts.append(account)

    def get_current_account(self) -> Optional[AccountCredentials]:
        """取得目前可用的帳號"""
        if not self.accounts:
            return None

        # 檢查所有帳號，找一個還有額度的
        for _ in range(len(self.accounts)):
            account = self.accounts[self.current_index]

            # 檢查是否需要重置月用量
            if datetime.now().month != account.last_reset.month:
                account.used_minutes = 0.0
                account.last_reset = datetime.now()

            # 檢查是否還有額度
            if account.enabled:
                if account.monthly_limit == 0 or account.used_minutes < account.monthly_limit:
                    return account

            # 這個帳號沒額度了，換下一個
            self.current_index = (self.current_index + 1) % len(self.accounts)

        logger.warning("All accounts exhausted!")
        return None

    def rotate_account(self):
        """強制切換到下一個帳號"""
        if self.accounts:
            self.current_index = (self.current_index + 1) % len(self.accounts)

    def record_usage(self, minutes: float):
        """記錄用量"""
        if self.accounts:
            self.accounts[self.current_index].used_minutes += minutes

    def get_status(self) -> dict:
        """取得所有帳號狀態"""
        return {
            "total_accounts": len(self.accounts),
            "current_index": self.current_index,
            "accounts": [
                {
                    "name": acc.name,
                    "used": acc.used_minutes,
                    "limit": acc.monthly_limit,
                    "enabled": acc.enabled,
                }
                for acc in self.accounts
            ]
        }


class AzureSpeechService(ASRService):
    """
    Azure Speech-to-Text Service
    免費額度: 5 小時/月 + 新用戶 $200
    價格: $0.017/分鐘 (即時)
    """

    def __init__(self, account_pool: Optional[AccountPool] = None):
        self.account_pool = account_pool or AccountPool()
        self._initialized = False

    def add_account(self, name: str, api_key: str, region: str, monthly_limit: float = 300):
        """新增 Azure 帳號 (預設月限 300 分鐘 = 5 小時)"""
        self.account_pool.add_account(AccountCredentials(
            name=name,
            api_key=api_key,
            region=region,
            monthly_limit=monthly_limit,
        ))

    async def initialize(self) -> None:
        if self._initialized:
            return

        try:
            import azure.cognitiveservices.speech as speechsdk
            self._speechsdk = speechsdk
            self._initialized = True
            logger.info(f"Azure Speech initialized with {len(self.account_pool.accounts)} accounts")
        except ImportError:
            logger.error("Missing azure-cognitiveservices-speech package")
            raise

    async def transcribe(self, audio_data: bytes) -> TranscriptionResult:
        if not self._initialized:
            await self.initialize()

        account = self.account_pool.get_current_account()
        if not account:
            logger.error("No available Azure accounts")
            return TranscriptionResult(text="", is_final=True, confidence=0.0)

        try:
            # 解碼音訊
            pcm_data = decode_audio(audio_data)

            # 寫入暫存 WAV 檔
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f:
                # 寫入 WAV header (16kHz, 16-bit, mono)
                import struct
                f.write(b'RIFF')
                f.write(struct.pack('<I', 36 + len(pcm_data)))
                f.write(b'WAVE')
                f.write(b'fmt ')
                f.write(struct.pack('<I', 16))  # chunk size
                f.write(struct.pack('<H', 1))   # audio format (PCM)
                f.write(struct.pack('<H', 1))   # channels
                f.write(struct.pack('<I', 16000))  # sample rate
                f.write(struct.pack('<I', 32000))  # byte rate
                f.write(struct.pack('<H', 2))   # block align
                f.write(struct.pack('<H', 16))  # bits per sample
                f.write(b'data')
                f.write(struct.pack('<I', len(pcm_data)))
                f.write(pcm_data)
                wav_path = f.name

            try:
                # 設定 Azure Speech
                speech_config = self._speechsdk.SpeechConfig(
                    subscription=account.api_key,
                    region=account.region
                )
                speech_config.speech_recognition_language = "zh-TW"

                audio_config = self._speechsdk.AudioConfig(filename=wav_path)
                recognizer = self._speechsdk.SpeechRecognizer(
                    speech_config=speech_config,
                    audio_config=audio_config
                )

                # 執行辨識
                result = recognizer.recognize_once()

                # 記錄用量 (以秒為單位，轉換為分鐘)
                duration_minutes = len(pcm_data) / 32000 / 60  # 16kHz * 2 bytes
                self.account_pool.record_usage(duration_minutes)

                if result.reason == self._speechsdk.ResultReason.RecognizedSpeech:
                    logger.info(f"Azure transcription: '{result.text}'")
                    return TranscriptionResult(text=result.text, is_final=True, confidence=0.9)
                else:
                    logger.warning(f"Azure no speech: {result.reason}")
                    return TranscriptionResult(text="", is_final=True, confidence=0.0)

            finally:
                os.unlink(wav_path)

        except Exception as e:
            logger.error(f"Azure transcription error: {e}")
            # 切換到下一個帳號
            self.account_pool.rotate_account()
            return TranscriptionResult(text="", is_final=True, confidence=0.0)

    async def reset(self) -> None:
        logger.info("Azure Speech reset")


class GoogleSpeechService(ASRService):
    """
    Google Cloud Speech-to-Text Service
    免費額度: 60 分鐘/月 + 新用戶 $300
    價格: $0.024/分鐘
    """

    def __init__(self, account_pool: Optional[AccountPool] = None):
        self.account_pool = account_pool or AccountPool()
        self._initialized = False
        self._client = None

    def add_account(self, name: str, credentials_json: str, project_id: str, monthly_limit: float = 60):
        """新增 Google Cloud 帳號 (預設月限 60 分鐘)"""
        self.account_pool.add_account(AccountCredentials(
            name=name,
            api_key=credentials_json,  # JSON 路徑或內容
            project_id=project_id,
            monthly_limit=monthly_limit,
        ))

    async def initialize(self) -> None:
        if self._initialized:
            return

        try:
            from google.cloud import speech
            self._speech = speech
            self._initialized = True
            logger.info(f"Google Speech initialized with {len(self.account_pool.accounts)} accounts")
        except ImportError:
            logger.error("Missing google-cloud-speech package")
            raise

    async def transcribe(self, audio_data: bytes) -> TranscriptionResult:
        if not self._initialized:
            await self.initialize()

        account = self.account_pool.get_current_account()
        if not account:
            logger.error("No available Google accounts")
            return TranscriptionResult(text="", is_final=True, confidence=0.0)

        try:
            # 設定認證
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = account.api_key

            # 解碼音訊
            pcm_data = decode_audio(audio_data)

            # 建立客戶端
            client = self._speech.SpeechClient()

            audio = self._speech.RecognitionAudio(content=pcm_data)
            config = self._speech.RecognitionConfig(
                encoding=self._speech.RecognitionConfig.AudioEncoding.LINEAR16,
                sample_rate_hertz=16000,
                language_code="zh-TW",
            )

            # 執行辨識
            response = client.recognize(config=config, audio=audio)

            # 記錄用量
            duration_minutes = len(pcm_data) / 32000 / 60
            self.account_pool.record_usage(duration_minutes)

            if response.results:
                text = response.results[0].alternatives[0].transcript
                confidence = response.results[0].alternatives[0].confidence
                logger.info(f"Google transcription: '{text}'")
                return TranscriptionResult(text=text, is_final=True, confidence=confidence)
            else:
                return TranscriptionResult(text="", is_final=True, confidence=0.0)

        except Exception as e:
            logger.error(f"Google transcription error: {e}")
            self.account_pool.rotate_account()
            return TranscriptionResult(text="", is_final=True, confidence=0.0)

    async def reset(self) -> None:
        logger.info("Google Speech reset")


class GeminiSpeechService(ASRService):
    """
    Google Gemini API 語音轉文字
    直接用 API Key，不用搞服務帳戶那堆鬼東西
    免費額度: 15 RPM, 1M tokens/day
    """

    def __init__(self, account_pool: Optional[AccountPool] = None):
        self.account_pool = account_pool or AccountPool()
        self._initialized = False

    def add_account(self, name: str, api_key: str, monthly_limit: float = 0):
        """新增 Gemini 帳號 (API Key 以 AIza 開頭)"""
        self.account_pool.add_account(AccountCredentials(
            name=name,
            api_key=api_key,
            monthly_limit=monthly_limit,
        ))

    async def initialize(self) -> None:
        if self._initialized:
            return

        try:
            import google.generativeai as genai
            self._genai = genai
            self._initialized = True
            logger.info(f"Gemini Speech initialized with {len(self.account_pool.accounts)} accounts")
        except ImportError:
            logger.error("Missing google-generativeai package. Run: pip install google-generativeai")
            raise

    async def transcribe(self, audio_data: bytes) -> TranscriptionResult:
        if not self._initialized:
            await self.initialize()

        account = self.account_pool.get_current_account()
        if not account:
            logger.error("No available Gemini accounts")
            return TranscriptionResult(text="", is_final=True, confidence=0.0)

        try:
            # 設定 API Key
            self._genai.configure(api_key=account.api_key)

            # 解碼音訊為 PCM
            pcm_data = decode_audio(audio_data)

            # 轉成 WAV 格式（Gemini 需要）
            import struct
            wav_buffer = bytearray()
            wav_buffer.extend(b'RIFF')
            wav_buffer.extend(struct.pack('<I', 36 + len(pcm_data)))
            wav_buffer.extend(b'WAVE')
            wav_buffer.extend(b'fmt ')
            wav_buffer.extend(struct.pack('<I', 16))
            wav_buffer.extend(struct.pack('<H', 1))   # PCM
            wav_buffer.extend(struct.pack('<H', 1))   # mono
            wav_buffer.extend(struct.pack('<I', 16000))  # sample rate
            wav_buffer.extend(struct.pack('<I', 32000))  # byte rate
            wav_buffer.extend(struct.pack('<H', 2))   # block align
            wav_buffer.extend(struct.pack('<H', 16))  # bits per sample
            wav_buffer.extend(b'data')
            wav_buffer.extend(struct.pack('<I', len(pcm_data)))
            wav_buffer.extend(pcm_data)

            # 使用 Gemini 2.0 Flash（支援音訊）
            model = self._genai.GenerativeModel('gemini-2.0-flash-exp')

            # 上傳音訊
            audio_file = self._genai.upload_file(
                data=bytes(wav_buffer),
                mime_type="audio/wav"
            )

            # 請求轉錄
            response = model.generate_content([
                "你是專業的語音轉文字系統。請將這段音訊精確轉錄成繁體中文。"
                "規則：1.只輸出轉錄文字 2.使用台灣繁體中文 3.不要加標點符號 4.不要解釋 5.聽不清就回覆空白",
                audio_file
            ])

            # 記錄用量
            duration_minutes = len(pcm_data) / 32000 / 60
            self.account_pool.record_usage(duration_minutes)

            # 清理上傳的檔案
            try:
                audio_file.delete()
            except:
                pass

            text = response.text.strip()

            # 過濾空白回應
            if text in ["", "空白", "無", "（無）", "(無)", "聽不清楚", "沒有語音"]:
                return TranscriptionResult(text="", is_final=True, confidence=0.0)

            logger.info(f"Gemini transcription: '{text}'")
            return TranscriptionResult(text=text, is_final=True, confidence=0.9)

        except Exception as e:
            logger.error(f"Gemini transcription error: {e}")
            self.account_pool.rotate_account()
            return TranscriptionResult(text="", is_final=True, confidence=0.0)

    async def reset(self) -> None:
        logger.info("Gemini Speech reset")


class OpenAIWhisperService(ASRService):
    """
    OpenAI Whisper API Service
    價格: $0.006/分鐘 (最便宜)
    無免費額度，但新用戶有 $5 額度
    """

    def __init__(self, account_pool: Optional[AccountPool] = None):
        self.account_pool = account_pool or AccountPool()
        self._initialized = False

    def add_account(self, name: str, api_key: str, monthly_limit: float = 0):
        """新增 OpenAI 帳號 (預設無限制)"""
        self.account_pool.add_account(AccountCredentials(
            name=name,
            api_key=api_key,
            monthly_limit=monthly_limit,
        ))

    async def initialize(self) -> None:
        if self._initialized:
            return

        try:
            import openai
            self._openai = openai
            self._initialized = True
            logger.info(f"OpenAI Whisper initialized with {len(self.account_pool.accounts)} accounts")
        except ImportError:
            logger.error("Missing openai package")
            raise

    async def transcribe(self, audio_data: bytes) -> TranscriptionResult:
        if not self._initialized:
            await self.initialize()

        account = self.account_pool.get_current_account()
        if not account:
            logger.error("No available OpenAI accounts")
            return TranscriptionResult(text="", is_final=True, confidence=0.0)

        try:
            # 解碼音訊並轉為 WAV
            pcm_data = decode_audio(audio_data)

            # 寫入暫存 WAV 檔
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f:
                import struct
                f.write(b'RIFF')
                f.write(struct.pack('<I', 36 + len(pcm_data)))
                f.write(b'WAVE')
                f.write(b'fmt ')
                f.write(struct.pack('<I', 16))
                f.write(struct.pack('<H', 1))
                f.write(struct.pack('<H', 1))
                f.write(struct.pack('<I', 16000))
                f.write(struct.pack('<I', 32000))
                f.write(struct.pack('<H', 2))
                f.write(struct.pack('<H', 16))
                f.write(b'data')
                f.write(struct.pack('<I', len(pcm_data)))
                f.write(pcm_data)
                wav_path = f.name

            try:
                # 使用 OpenAI API
                client = self._openai.OpenAI(api_key=account.api_key)

                with open(wav_path, "rb") as audio_file:
                    response = client.audio.transcriptions.create(
                        model="whisper-1",
                        file=audio_file,
                        language="zh",
                    )

                # 記錄用量
                duration_minutes = len(pcm_data) / 32000 / 60
                self.account_pool.record_usage(duration_minutes)

                text = response.text.strip()
                logger.info(f"OpenAI transcription: '{text}'")
                return TranscriptionResult(text=text, is_final=True, confidence=0.95)

            finally:
                os.unlink(wav_path)

        except Exception as e:
            logger.error(f"OpenAI transcription error: {e}")
            self.account_pool.rotate_account()
            return TranscriptionResult(text="", is_final=True, confidence=0.0)

    async def reset(self) -> None:
        logger.info("OpenAI Whisper reset")


class MultiProviderASRService(ASRService):
    """
    多提供商 ASR 服務
    自動在不同提供商之間切換，優先使用免費額度
    """

    def __init__(self):
        self.providers: dict[str, ASRService] = {}
        self.provider_order: list[str] = []
        self.current_provider_index: int = 0
        self._initialized = False

    def add_provider(self, name: str, service: ASRService, priority: int = 0):
        """新增提供商"""
        self.providers[name] = service
        # 按優先順序排序
        self.provider_order.append((priority, name))
        self.provider_order.sort(key=lambda x: x[0])

    def get_current_provider(self) -> tuple[str, ASRService]:
        """取得目前的提供商"""
        if not self.provider_order:
            raise ValueError("No providers configured")
        _, name = self.provider_order[self.current_provider_index]
        return name, self.providers[name]

    async def initialize(self) -> None:
        if self._initialized:
            return

        for name, service in self.providers.items():
            try:
                await service.initialize()
                logger.info(f"Initialized provider: {name}")
            except Exception as e:
                logger.warning(f"Failed to initialize {name}: {e}")

        self._initialized = True

    async def transcribe(self, audio_data: bytes) -> TranscriptionResult:
        if not self._initialized:
            await self.initialize()

        # 嘗試所有提供商
        for _ in range(len(self.provider_order)):
            name, service = self.get_current_provider()
            logger.info(f"Using provider: {name}")

            result = await service.transcribe(audio_data)

            if result.text:
                return result

            # 切換到下一個提供商
            self.current_provider_index = (self.current_provider_index + 1) % len(self.provider_order)

        return TranscriptionResult(text="", is_final=True, confidence=0.0)

    async def reset(self) -> None:
        for service in self.providers.values():
            await service.reset()

    def get_status(self) -> dict:
        """取得所有提供商狀態"""
        status = {}
        for name, service in self.providers.items():
            if hasattr(service, 'account_pool'):
                status[name] = service.account_pool.get_status()
        return status


def load_cloud_config(config_path: str = "cloud_asr_config.json") -> MultiProviderASRService:
    """從設定檔載入雲端 ASR 設定"""
    multi_service = MultiProviderASRService()

    if not os.path.exists(config_path):
        logger.warning(f"Config file not found: {config_path}")
        return multi_service

    with open(config_path, 'r', encoding='utf-8') as f:
        config = json.load(f)

    # 載入 Azure 帳號
    if "azure" in config:
        azure_service = AzureSpeechService()
        for acc in config["azure"].get("accounts", []):
            azure_service.add_account(
                name=acc["name"],
                api_key=acc["api_key"],
                region=acc["region"],
                monthly_limit=acc.get("monthly_limit", 300),
            )
        if azure_service.account_pool.accounts:
            multi_service.add_provider("azure", azure_service, priority=1)

    # 載入 Google 帳號
    if "google" in config:
        google_service = GoogleSpeechService()
        for acc in config["google"].get("accounts", []):
            google_service.add_account(
                name=acc["name"],
                credentials_json=acc["credentials_json"],
                project_id=acc["project_id"],
                monthly_limit=acc.get("monthly_limit", 60),
            )
        if google_service.account_pool.accounts:
            multi_service.add_provider("google", google_service, priority=2)

    # 載入 OpenAI 帳號
    if "openai" in config:
        openai_service = OpenAIWhisperService()
        for acc in config["openai"].get("accounts", []):
            openai_service.add_account(
                name=acc["name"],
                api_key=acc["api_key"],
                monthly_limit=acc.get("monthly_limit", 0),
            )
        if openai_service.account_pool.accounts:
            multi_service.add_provider("openai", openai_service, priority=3)

    # 載入 Gemini 帳號（最簡單，只要 API Key）
    if "gemini" in config:
        gemini_service = GeminiSpeechService()
        for acc in config["gemini"].get("accounts", []):
            gemini_service.add_account(
                name=acc["name"],
                api_key=acc["api_key"],
                monthly_limit=acc.get("monthly_limit", 0),
            )
        if gemini_service.account_pool.accounts:
            multi_service.add_provider("gemini", gemini_service, priority=0)  # 最高優先

    return multi_service
