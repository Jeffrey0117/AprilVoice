"""
AprilVoice Backend - FastAPI WebSocket Server
"""

import asyncio
import base64
import json
import logging
import os
from concurrent.futures import ThreadPoolExecutor
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from asr_service import create_asr_service, ASRService
from cloud_asr import load_cloud_config, MultiProviderASRService

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

asr_service: Optional[ASRService] = None
executor = ThreadPoolExecutor(max_workers=2)


def create_cloud_asr_service() -> Optional[ASRService]:
    """嘗試從配置檔案載入雲端 ASR 服務"""
    config_path = os.getenv("CLOUD_ASR_CONFIG", "cloud_asr_config.json")

    if not os.path.exists(config_path):
        logger.info(f"Cloud ASR config not found: {config_path}")
        return None

    try:
        service = load_cloud_config(config_path)
        if service.providers:
            logger.info(f"Loaded cloud ASR with providers: {list(service.providers.keys())}")
            return service
        else:
            logger.warning("Cloud ASR config loaded but no providers configured")
            return None
    except Exception as e:
        logger.error(f"Failed to load cloud ASR config: {e}")
        return None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global asr_service
    logger.info("Starting AprilVoice Backend...")

    # ASR 模式優先順序:
    # 1. USE_CLOUD_ASR=1 -> 使用雲端 API
    # 2. USE_MOCK_ASR=1 -> 使用假的 ASR (開發用)
    # 3. 預設 -> 使用本地 faster-whisper

    use_cloud = os.getenv("USE_CLOUD_ASR", "0") == "1"
    use_mock = os.getenv("USE_MOCK_ASR", "0") == "1"

    if use_cloud:
        logger.info("Cloud ASR mode enabled")
        asr_service = create_cloud_asr_service()
        if not asr_service:
            logger.warning("Cloud ASR not available, falling back to local")
            use_cloud = False

    if not use_cloud:
        asr_service = create_asr_service(use_mock=use_mock)

    try:
        await asr_service.initialize()
        mode = "cloud" if use_cloud else ("mock" if use_mock else "local")
        logger.info(f"ASR service initialized (mode: {mode})")
    except Exception as e:
        logger.error(f"Failed to initialize ASR: {e}")
        if not use_mock:
            logger.info("Falling back to mock ASR")
            asr_service = create_asr_service(use_mock=True)
            await asr_service.initialize()

    yield

    logger.info("Shutting down...")


app = FastAPI(
    title="AprilVoice API",
    description="Real-time speech-to-text service",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class HealthResponse(BaseModel):
    status: str
    service: str
    asr_ready: bool


@app.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="healthy",
        service="AprilVoice API",
        asr_ready=asr_service is not None
    )


@app.get("/")
async def root():
    return {
        "name": "AprilVoice API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "websocket": "/ws/transcribe",
            "cloud_status": "/cloud/status"
        }
    }


@app.get("/cloud/status")
async def cloud_status():
    """查看雲端 ASR 帳號使用狀態"""
    if asr_service is None:
        return {"error": "ASR service not initialized"}

    if isinstance(asr_service, MultiProviderASRService):
        return {
            "mode": "cloud",
            "providers": asr_service.get_status(),
            "current_provider": asr_service.provider_order[asr_service.current_provider_index][1]
            if asr_service.provider_order else None
        }
    else:
        return {
            "mode": "local",
            "message": "Using local ASR (faster-whisper)"
        }


class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"Client connected. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        logger.info(f"Client disconnected. Total: {len(self.active_connections)}")


manager = ConnectionManager()


@app.websocket("/ws/transcribe")
async def websocket_transcribe(websocket: WebSocket):
    await manager.connect(websocket)
    is_connected = True

    async def process_audio(audio_chunk: bytes):
        """在背景處理音訊辨識"""
        nonlocal is_connected
        if not asr_service or not is_connected:
            return

        try:
            logger.info(f"Transcribing {len(audio_chunk)} bytes...")
            # 在線程池中執行同步的辨識操作
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                executor,
                lambda: asyncio.run(asr_service.transcribe(audio_chunk))
            )
            logger.info(f"Transcription result: '{result.text}' (final={result.is_final})")
            logger.info(f"is_connected={is_connected}, text_bool={bool(result.text)}")

            if result.text and is_connected:
                try:
                    await websocket.send_json({
                        "type": "transcript",
                        "text": result.text,
                        "is_final": result.is_final
                    })
                    logger.info(f"Sent transcript to client: {result.text}")
                except Exception as send_err:
                    logger.error(f"Failed to send: {send_err}")
            else:
                logger.warning(f"Skipped sending: text={bool(result.text)}, connected={is_connected}")
        except Exception as e:
            logger.error(f"Transcription error: {e}")

    try:
        if asr_service:
            await asr_service.reset()

        while True:
            try:
                # 設定接收超時，避免阻塞
                data = await asyncio.wait_for(
                    websocket.receive_text(),
                    timeout=30.0
                )
                message = json.loads(data)
            except asyncio.TimeoutError:
                # 發送心跳
                try:
                    await websocket.send_json({"type": "heartbeat"})
                except:
                    break
                continue
            except json.JSONDecodeError:
                await websocket.send_json({"type": "error", "message": "Invalid JSON"})
                continue

            msg_type = message.get("type", "")

            if msg_type == "audio":
                audio_b64 = message.get("data", "")
                if not audio_b64:
                    continue

                try:
                    audio_chunk = base64.b64decode(audio_b64)
                except Exception as e:
                    logger.error(f"Failed to decode audio: {e}")
                    continue

                # 在背景處理，不阻塞主迴圈
                if len(audio_chunk) > 1000:
                    asyncio.create_task(process_audio(audio_chunk))

            elif msg_type == "reset":
                if asr_service:
                    await asr_service.reset()
                await websocket.send_json({"type": "status", "message": "Reset"})

            elif msg_type == "ping":
                await websocket.send_json({"type": "pong"})

    except WebSocketDisconnect:
        logger.info("Client disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        is_connected = False
        manager.disconnect(websocket)
        if asr_service:
            await asr_service.reset()


if __name__ == "__main__":
    import uvicorn

    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))

    logger.info(f"Starting server on {host}:{port}")
    uvicorn.run("main:app", host=host, port=port, reload=True)
