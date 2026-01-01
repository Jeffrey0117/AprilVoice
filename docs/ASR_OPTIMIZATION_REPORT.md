# AprilVoice ASR 優化報告

## 目錄
1. [目前狀態](#目前狀態)
2. [本地優化方案](#本地優化方案)
3. [雲端 ASR 服務比較](#雲端-asr-服務比較)
4. [費用估算](#費用估算)
5. [建議方案](#建議方案)

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

### 短期 (現在可做)

1. **累積音訊優化** - 將 1.5 秒片段改為 3 秒處理
2. **測試 base 模型** - 如果準確度可接受，速度再提升 3x

### 中期 (需要評估)

3. **OpenAI Whisper API** - 最佳性價比雲端方案
   - 月費約 NT$500
   - 準確度最高
   - 實作簡單 (REST API)

### 長期 (需要投資)

4. **GPU 加速** - 如果有 NVIDIA GPU
   - 一次性投資 (RTX 3060 約 NT$8,000)
   - 長期免月費
   - medium/large 模型也能即時辨識

---

## 實作優先順序

| 優先級 | 方案 | 預期效果 | 實作時間 |
|-------|------|---------|---------|
| 1 | 累積音訊 (3秒) | 減少 50% 處理次數 | 1 小時 |
| 2 | 測試 base 模型 | 再快 3x | 10 分鐘 |
| 3 | 增加 CPU 線程 | 快 20-50% | 5 分鐘 |
| 4 | OpenAI API 整合 | 最佳準確度 | 2 小時 |
| 5 | GPU 支援 | 10x 速度 | 1 小時 |

---

## 附錄: 參考資料

- [OpenAI Whisper API Pricing](https://platform.openai.com/docs/pricing)
- [Google Cloud Speech-to-Text Pricing](https://cloud.google.com/speech-to-text/pricing)
- [Azure Speech Services Pricing](https://azure.microsoft.com/en-us/pricing/details/cognitive-services/speech-services/)
- [Speech-to-Text API Pricing Breakdown 2025](https://deepgram.com/learn/speech-to-text-api-pricing-breakdown-2025)
- [Best Speech to Text APIs 2025](https://vocafuse.com/blog/best-speech-to-text-api-comparison-2025/)
