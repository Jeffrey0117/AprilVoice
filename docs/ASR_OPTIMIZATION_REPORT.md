# AprilVoice ASR 優化報告

## 目錄
1. [目前狀態](#目前狀態)
2. [白嫖策略：免費 API 額度](#白嫖策略免費-api-額度)
3. [GPU 顯卡購買指南](#gpu-顯卡購買指南)
4. [本地優化方案](#本地優化方案)
5. [雲端 ASR 服務比較](#雲端-asr-服務比較)
6. [費用估算](#費用估算)
7. [建議方案](#建議方案)

---

## 目前狀態

### 已完成的優化

| 優化項目 | 之前 | 之後 | 改善幅度 |
|---------|------|------|----------|
| ASR 引擎 | Breeze-ASR-25 | faster-whisper | 4x 速度提升 |
| 模型大小 | medium | small | 3-4x 速度提升 |
| Beam Size | 5 | 1 (greedy) | 2x 速度提升 |
| 單次辨識時間 | 10-20 秒 | 3-5 秒 | 4x 改善 |

### 目前技術棧
- **引擎**: faster-whisper (CTranslate2)
- **模型**: whisper-small
- **量化**: int8
- **執行環境**: CPU (4 線程)

---

## 白嫖策略：免費 API 額度

### 免費額度總覽

| 服務 | 免費額度 | 換算時間 | 新用戶優惠 | 有效期 |
|------|---------|---------|-----------|-------|
| **Azure Speech** | 5 小時/月 | 300 分鐘 | 另有 $200 額度 | 每月重置 |
| **Google Cloud** | 60 分鐘/月 | 60 分鐘 | $300 額度 | 90 天 |
| **AWS Transcribe** | 60 分鐘/月 | 60 分鐘 | - | 前 12 個月 |
| **OpenAI** | 無免費額度 | - | $5 初始額度 | - |

### 最佳白嫖順序

#### 第一階段：Azure (推薦先用)
```
免費額度: 5 小時/月 = 300 分鐘
新用戶額外: $200 免費額度 (30天內用完)
               = $200 ÷ $0.017 = 11,764 分鐘 ≈ 196 小時

總計可白嫖: ~200 小時
```

**註冊連結**: [Azure Free Account](https://azure.microsoft.com/free/)

#### 第二階段：Google Cloud
```
免費額度: 60 分鐘/月
新用戶額外: $300 免費額度 (90天內用完)
               = $300 ÷ $0.024 = 12,500 分鐘 ≈ 208 小時

總計可白嫖: ~210 小時
```

**註冊連結**: [Google Cloud Free Trial](https://cloud.google.com/free)

#### 第三階段：AWS
```
免費額度: 60 分鐘/月 × 12 個月 = 720 分鐘 ≈ 12 小時

總計可白嫖: ~12 小時
```

**註冊連結**: [AWS Free Tier](https://aws.amazon.com/free/)

### 白嫖時間表

| 月份 | 使用服務 | 免費額度 | 累計白嫖時間 |
|------|---------|---------|-------------|
| 1 | Azure (新用戶 $200) | 196 小時 | 196 小時 |
| 2 | Azure (月免費) | 5 小時 | 201 小時 |
| 3 | Google (新用戶 $300) | 208 小時 | 409 小時 |
| 4-6 | Google (月免費) | 3 小時 | 412 小時 |
| 7-12 | AWS (月免費) | 6 小時 | 418 小時 |

**總計可白嫖約 400+ 小時，足夠用半年到一年！**

### 多帳號策略 (進階)

如果有多個 Email，可以：
- 用不同 Email 註冊多個雲端帳號
- 輪流使用各家的新用戶優惠
- 理論上可以無限白嫖 (但要注意各家的 ToS)

---

## GPU 顯卡購買指南

### 為什麼要買 GPU？

| 對比項目 | CPU (目前) | GPU (升級後) |
|---------|-----------|-------------|
| small 模型 | 3-5 秒 | 0.1-0.2 秒 |
| medium 模型 | 10-15 秒 | 0.3-0.5 秒 |
| large-v3 模型 | 20+ 秒 | 0.5-1 秒 |
| 即時辨識 | 勉強 | 完美 |
| 月費用 | 電費 ~NT$50 | 電費 ~NT$100 |

### GPU 性價比排名 (2025年)

| 排名 | 顯卡 | VRAM | 新品價格 (TWD) | 二手價格 | Whisper 速度 | 推薦度 |
|------|------|------|---------------|---------|-------------|--------|
| 🥇 | **RTX 3060 12GB** | 12GB | ~NT$8,000 | ~NT$5,000 | 快 15x | ⭐⭐⭐⭐⭐ |
| 🥈 | **RTX 4060 Ti 16GB** | 16GB | ~NT$15,000 | - | 快 20x | ⭐⭐⭐⭐ |
| 🥉 | **RTX 4070** | 12GB | ~NT$18,000 | - | 快 25x | ⭐⭐⭐⭐ |
| 4 | RTX 3080 10GB | 10GB | - | ~NT$12,000 | 快 22x | ⭐⭐⭐ |
| 5 | RTX 4090 | 24GB | ~NT$60,000 | - | 快 40x | ⭐⭐ (太貴) |

### 最佳推薦：RTX 3060 12GB

**為什麼選 RTX 3060 12GB？**

1. **VRAM 夠大** - 12GB 可以跑 large-v3 模型
2. **價格親民** - 新品約 NT$8,000，二手約 NT$5,000
3. **性價比最高** - 根據 [Tom's Hardware 測試](https://www.tomshardware.com/news/whisper-audio-transcription-gpus-benchmarked)
4. **功耗適中** - 170W，不需要升級電源
5. **驅動成熟** - CUDA 支援完善

**投資回報計算**:
```
GPU 成本: NT$8,000 (新品) 或 NT$5,000 (二手)
vs
雲端費用: NT$500/月 (OpenAI)

回本時間: 8,000 ÷ 500 = 16 個月
          5,000 ÷ 500 = 10 個月

結論: 買二手 3060，10 個月後就開始賺！
```

### VRAM 需求對照表

| 模型 | 最低 VRAM | 建議 VRAM |
|------|----------|----------|
| tiny | 1GB | 2GB |
| base | 1GB | 2GB |
| small | 2GB | 4GB |
| medium | 5GB | 8GB |
| large-v3 | 10GB | 12GB |

### 購買建議

#### 預算有限 (< NT$6,000)
- **選擇**: 二手 RTX 3060 12GB
- **來源**: 蝦皮、PTT 顯示卡版、原價屋二手
- **注意**: 確認非礦卡，測試風扇和溫度

#### 預算中等 (NT$8,000-15,000)
- **選擇**: 新品 RTX 3060 12GB 或 RTX 4060 Ti 16GB
- **來源**: 原價屋、欣亞、PChome
- **優點**: 有保固，效能更好

#### 預算充足 (> NT$15,000)
- **選擇**: RTX 4070 或 RTX 4070 Super
- **優點**: 效能最佳，未來可做其他 AI 應用

---

## 本地優化方案

### 1. 累積音訊再處理 (推薦)

**原理**: 目前每 1.5 秒片段獨立處理，改為累積 3-5 秒再處理

**優點**:
- 減少處理次數 50-70%
- 更長的上下文提升辨識準確度
- 不需要更換模型

**預期效果**: 延遲增加 1-2 秒，但整體 CPU 使用降低

**實作難度**: ⭐⭐ (中等)

---

### 2. 使用更小的模型

| 模型 | 參數量 | 辨識時間 (1.5秒音訊) | 中文準確度 |
|------|--------|---------------------|-----------|
| tiny | 39M | ~0.5 秒 | ⭐⭐ |
| base | 74M | ~1 秒 | ⭐⭐⭐ |
| small | 244M | ~3 秒 | ⭐⭐⭐⭐ |
| medium | 769M | ~10 秒 | ⭐⭐⭐⭐⭐ |

**建議**: 可測試 `base` 模型，速度提升 3x，準確度略降

---

### 3. 降低音訊發送頻率

**目前**: 每 1.5 秒發送一次
**建議**: 改為 3 秒發送一次

**優點**: 減少 50% 的處理次數
**缺點**: 即時性降低

---

### 4. 增加 CPU 線程數

```python
# 目前設定
cpu_threads=4

# 根據你的 CPU 核心數調整
cpu_threads=8  # 如果有 8 核心以上
```

---

### 5. GPU 加速 (如果有 NVIDIA GPU)

```python
# 使用 CUDA
self._model = WhisperModel(
    self.model_size,
    device="cuda",
    compute_type="float16",  # GPU 用 float16
)
```

**效果**: 比 CPU 快 10-20x，medium 模型也可以即時辨識

---

## 雲端 ASR 服務比較

### 價格對比 (2025年)

| 服務 | 即時價格 | 批次價格 | 免費額度 | 中文支援 |
|------|---------|---------|---------|---------|
| **OpenAI Whisper API** | $0.006/分鐘 | - | 無 | ⭐⭐⭐⭐⭐ |
| **Google Speech-to-Text** | $0.024/分鐘 | $0.004/分鐘 | 60分鐘/月 | ⭐⭐⭐⭐ |
| **Azure Speech** | $0.017/分鐘 | $0.006/分鐘 | 5小時/月 | ⭐⭐⭐⭐ |
| **AWS Transcribe** | $0.024/分鐘 | - | 60分鐘/月 | ⭐⭐⭐ |

### 詳細費用分析

#### OpenAI Whisper API
- **價格**: $0.006/分鐘 ($0.36/小時)
- **優點**: 最便宜、中文辨識最準確 (與本地 Whisper 相同模型)
- **缺點**: 無即時串流、單檔最大 25MB (~30分鐘)
- **延遲**: 1-3 秒
- **來源**: [OpenAI Pricing](https://platform.openai.com/docs/pricing)

#### Google Cloud Speech-to-Text
- **標準價格**: $0.024/分鐘 ($1.44/小時)
- **批次價格**: $0.004/分鐘 (24小時內回傳)
- **免費額度**: 每月 60 分鐘
- **優點**: 即時串流支援、多語言辨識
- **缺點**: 需要 GCP 生態系統、額外基礎設施費用
- **來源**: [Google Cloud Pricing](https://cloud.google.com/speech-to-text/pricing)

#### Azure Speech Services
- **即時價格**: $0.017/分鐘 ($1.00/小時)
- **批次價格**: $0.006/分鐘 ($0.36/小時)
- **免費額度**: 每月 5 小時
- **優點**: 即時串流、自訂模型支援
- **缺點**: 自訂模型託管額外收費 ($0.0538/模型/小時)
- **來源**: [Azure Pricing](https://azure.microsoft.com/en-us/pricing/details/cognitive-services/speech-services/)

---

## 費用估算

### 使用場景假設
- 每天使用 2 小時 (120 分鐘)
- 每月 22 個工作日
- 月用量: 2,640 分鐘 (44 小時)

### 月費用估算

| 服務 | 計算方式 | 月費用 (USD) | 月費用 (TWD) |
|------|---------|-------------|-------------|
| **本地 faster-whisper** | 電費 + 硬體折舊 | ~$5 | ~NT$160 |
| **OpenAI Whisper API** | 2,640 × $0.006 | $15.84 | ~NT$500 |
| **Azure (批次)** | 2,640 × $0.006 | $15.84 | ~NT$500 |
| **Azure (即時)** | 2,640 × $0.017 | $44.88 | ~NT$1,400 |
| **Google (標準)** | 2,640 × $0.024 | $63.36 | ~NT$2,000 |

---

## 建議方案

### 推薦路線圖

```
現在 ────────────────────────────────────────────► 未來
  │
  ├── 第1步: 白嫖 Azure ($200 免費額度)
  │          └── 用完約 200 小時 (~2-3個月)
  │
  ├── 第2步: 白嫖 Google Cloud ($300 免費額度)
  │          └── 用完約 210 小時 (~2-3個月)
  │
  ├── 第3步: 評估是否購買 GPU
  │          ├── 是 → 買 RTX 3060 12GB (NT$5,000-8,000)
  │          │        └── 長期免費，即時辨識
  │          │
  │          └── 否 → 繼續用 OpenAI API (NT$500/月)
  │
  └── 持續優化本地方案作為備案
```

### 時間軸

| 階段 | 時間 | 行動 | 成本 |
|------|------|------|------|
| 現在 | 第 1-3 月 | 用 Azure 免費額度 | $0 |
| 中期 | 第 4-6 月 | 用 Google 免費額度 | $0 |
| 決策點 | 第 6 月 | 評估用量，決定買 GPU 或用 API | - |
| 長期 A | 第 7 月+ | 買 GPU，本地運行 | 一次性 NT$5,000-8,000 |
| 長期 B | 第 7 月+ | 用 OpenAI API | NT$500/月 |

---

## 實作優先順序

| 優先級 | 方案 | 預期效果 | 實作時間 | 成本 |
|-------|------|---------|---------|------|
| 1 | 註冊 Azure 免費帳號 | 200 小時免費 | 30 分鐘 | $0 |
| 2 | 整合 Azure Speech API | 雲端即時辨識 | 2 小時 | $0 |
| 3 | 累積音訊 (3秒) | 減少處理次數 | 1 小時 | $0 |
| 4 | 註冊 Google Cloud | 210 小時免費 | 30 分鐘 | $0 |
| 5 | 買 RTX 3060 GPU | 10x 速度 | 購買+安裝 | NT$5,000-8,000 |

---

## 附錄: 參考資料

### 價格資訊
- [OpenAI Whisper API Pricing](https://platform.openai.com/docs/pricing)
- [Google Cloud Speech-to-Text Pricing](https://cloud.google.com/speech-to-text/pricing)
- [Azure Speech Services Pricing](https://azure.microsoft.com/en-us/pricing/details/cognitive-services/speech-services/)
- [Speech-to-Text API Pricing Breakdown 2025](https://deepgram.com/learn/speech-to-text-api-pricing-breakdown-2025)

### GPU 效能測試
- [Whisper Audio Transcription GPUs Benchmarked - Tom's Hardware](https://www.tomshardware.com/news/whisper-audio-transcription-gpus-benchmarked)
- [Performance benchmark of different GPUs - OpenAI Whisper GitHub](https://github.com/openai/whisper/discussions/918)
- [Best GPU for Whisper - OpenAI Community](https://community.openai.com/t/best-gpu-card-to-improve-whisper-performances/594457)

### 免費額度註冊
- [Azure Free Account](https://azure.microsoft.com/free/)
- [Google Cloud Free Trial](https://cloud.google.com/free)
- [AWS Free Tier](https://aws.amazon.com/free/)
