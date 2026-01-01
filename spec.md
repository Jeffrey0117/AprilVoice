# AprilVoice - 語音轉文字雙向顯示應用

## 專案概述
一個即時語音轉文字的 Web 應用，專為兩人面對面溝通設計。螢幕分為上下兩部分，顯示相同文字但方向相反，讓坐在對面的兩個人都能輕鬆閱讀。

## 技術架構

### 後端 - ASR 引擎
- **來源**: https://github.com/mtkresearch/Breeze-ASR-25.git
- **功能**: 中文語音辨識
- **通訊**: WebSocket 即時串流

### 前端 - Web 應用
- **框架**: React + TypeScript
- **樣式**: Tailwind CSS
- **設計**: Mobile-first，響應式設計
- **未來擴充**: 可打包為 PWA 或原生 APP

## 功能規格

### 核心功能
1. **即時語音辨識**
   - 點擊麥克風按鈕開始/停止錄音
   - 語音即時轉換為文字
   - 支援連續對話

2. **雙向文字顯示**
   - 螢幕分為上下兩區
   - 上半部: 文字倒置 180 度 (給對面的人看)
   - 下半部: 正常顯示 (給自己看)
   - 兩區顯示完全相同的內容

3. **文字管理**
   - 自動捲動到最新內容
   - 清除按鈕重置對話
   - 歷史文字保留在畫面中

### UI 設計

```
┌─────────────────────────────┐
│                             │
│   ꓕXꓕꓕ ǝsɹǝʌǝɹ pǝʎɐldsᴉp   │  ← 上半部 (180度旋轉)
│   給對面的人閱讀             │
│                             │
├─────────────────────────────┤
│                             │
│   正常顯示的文字             │  ← 下半部 (正常方向)
│   給自己閱讀                 │
│                             │
├─────────────────────────────┤
│         🎤  🗑️              │  ← 控制列
└─────────────────────────────┘
```

### 按鈕功能
- **麥克風按鈕**: 開始/停止錄音 (錄音中顯示紅色動畫)
- **清除按鈕**: 清空所有文字

## API 規格

### WebSocket 連接
```
ws://localhost:8000/ws/transcribe
```

### 訊息格式

**Client → Server (音訊串流)**
```json
{
  "type": "audio",
  "data": "<base64 encoded audio chunk>"
}
```

**Server → Client (辨識結果)**
```json
{
  "type": "transcript",
  "text": "辨識出的文字",
  "is_final": true
}
```

## 檔案結構

```
aprilvoice/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── MicrophoneButton.tsx
│   │   │   ├── TextDisplay.tsx
│   │   │   └── ControlBar.tsx
│   │   ├── hooks/
│   │   │   ├── useAudioRecorder.ts
│   │   │   └── useWebSocket.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── backend/
│   ├── main.py              # FastAPI 主程式
│   ├── asr_service.py       # Breeze-ASR 整合
│   ├── requirements.txt
│   └── Dockerfile
│
├── spec.md
└── README.md
```

## 開發階段

### MVP (Phase 1)
- [x] 規格書完成
- [ ] 基本 UI 框架
- [ ] 麥克風錄音功能
- [ ] WebSocket 連接
- [ ] ASR 整合
- [ ] 雙向文字顯示

### 未來擴充 (Phase 2+)
- PWA 支援
- 多語言支援
- 對話歷史儲存
- 語音合成 (TTS)
- APP 打包

## 環境需求

### 前端
- Node.js 18+
- npm 或 pnpm

### 後端
- Python 3.10+
- CUDA (建議，用於 ASR 加速)
- Breeze-ASR-25 模型

## 啟動指令

```bash
# 前端
cd frontend && npm install && npm run dev

# 後端
cd backend && pip install -r requirements.txt && python main.py
```
