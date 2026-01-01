# AprilVoice

語音轉文字雙向顯示應用 - 專為兩人面對面溝通設計。

## 功能

- 即時語音辨識
- 雙向文字顯示（上半部旋轉180度給對面的人看）
- 使用 Breeze-ASR-25 中文語音辨識引擎

## 專案結構

```
aprilvoice/
├── frontend/          # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/
│   │   │   ├── TextDisplay.tsx
│   │   │   ├── MicrophoneButton.tsx
│   │   │   └── ControlBar.tsx
│   │   ├── hooks/
│   │   │   ├── useWebSocket.ts
│   │   │   └── useAudioRecorder.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── ...
├── backend/           # FastAPI + WebSocket
│   ├── main.py
│   ├── asr_service.py
│   └── requirements.txt
└── spec.md
```

## 安裝與啟動

### 前端

```bash
cd frontend
npm install
npm run dev
```

前端將在 http://localhost:5173 啟動

### 後端

```bash
cd backend
pip install -r requirements.txt
python main.py
```

後端將在 http://localhost:8000 啟動

### 使用真正的 ASR

預設使用 mock ASR，要啟用 Breeze-ASR-25：

```bash
# 安裝額外依賴
pip install torch torchaudio transformers accelerate

# 設定環境變數
set USE_REAL_ASR=1  # Windows
export USE_REAL_ASR=1  # Linux/Mac

python main.py
```

## API

- `GET /` - API 資訊
- `GET /health` - 健康檢查
- `WebSocket /ws/transcribe` - 即時語音轉文字

## 技術棧

- **前端**: React 18, TypeScript, Vite, Tailwind CSS
- **後端**: FastAPI, WebSocket, Breeze-ASR-25
- **ASR**: https://github.com/mtkresearch/Breeze-ASR-25
