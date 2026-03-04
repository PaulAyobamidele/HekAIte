# 🚀 AI Guardian - Setup Guide

This guide will get you from zero to running in **5 minutes**.

## Prerequisites

- **Python 3.11+** (check with `python --version`)
- **pip** (Python package manager)

That's it for MVP! (Database/Redis optional for now)

---

## Quick Start

### 1️⃣ Create Virtual Environment

```bash
cd ai-guardian/backend
python -m venv venv
```

### 2️⃣ Activate Virtual Environment

**macOS/Linux:**
```bash
source venv/bin/activate
```

**Windows:**
```bash
venv\Scripts\activate
```

### 3️⃣ Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

**Note:** First install will take 3-5 minutes (downloading ML models).

### 4️⃣ Create Environment File

```bash
cp ../.env.example .env
```

(The defaults work fine for local development)

### 5️⃣ Start the Server

```bash
cd backend
uvicorn app.main:app --reload
```

You should see:
```
🚀 Starting AI Guardian v0.1.0
🧠 Loading ML models...
✅ Models loaded successfully
📍 API docs: http://localhost:8000/api/v1/docs
```

### 6️⃣ Test It!

**Open another terminal:**

```bash
cd ai-guardian/backend
python test_api.py
```

---

## What Just Happened?

✅ FastAPI server running on `http://localhost:8000`
✅ Sentence transformer model loaded (for embeddings)
✅ Three evaluators initialized:
   - Hallucination Detector
   - Safety Classifier
   - Confidence Scorer

---

## API Documentation

**Interactive docs:** http://localhost:8000/api/v1/docs

**ReDoc:** http://localhost:8000/api/v1/redoc

---

## Quick API Test (Manual)

### Using curl:

```bash
curl -X POST "http://localhost:8000/api/v1/evaluate" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "What is the capital of France?",
    "model_output": "The capital of France is Paris.",
    "context": ["Paris is the capital of France."]
  }'
```

### Using Python:

```python
import requests

response = requests.post(
    "http://localhost:8000/api/v1/evaluate",
    json={
        "prompt": "What is the capital of France?",
        "model_output": "The capital of France is Paris.",
        "context": ["Paris is the capital of France."]
    }
)

print(response.json())
```

---

## Understanding the Response

```json
{
  "overall_risk": "low",           // low | medium | high | critical
  "recommended_action": "allow",   // allow | flag | review | block
  
  "hallucination": {
    "score": 0.12,                 // 0 = no hallucination, 1 = total hallucination
    "unsupported_claims": [],
    "coverage_ratio": 0.95,
    "explanation": "All claims well-supported"
  },
  
  "safety": {
    "score": 0.98,                 // 0 = unsafe, 1 = safe
    "violations": [],
    "categories": {...},
    "explanation": "No safety concerns"
  },
  
  "confidence": {
    "score": 0.85,                 // 0 = very uncertain, 1 = very confident
    "uncertainty_markers": [],
    "hedging_detected": false,
    "explanation": "High confidence response"
  },
  
  "evaluation_id": "eval_abc123",
  "timestamp": "2024-02-04T10:30:00Z",
  "processing_time_ms": 245.3,
  "summary": "Low risk output with no hallucinations..."
}
```

---

## Troubleshooting

### "ModuleNotFoundError: No module named 'app'"

Make sure you're running from the `backend/` directory:
```bash
cd backend
uvicorn app.main:app --reload
```

### "RuntimeError: No active event loop"

This is usually fine - it's just a warning from sentence-transformers.

### Models downloading slowly

First run downloads ~80MB of models. Subsequent runs use cached models.

### Port 8000 already in use

```bash
uvicorn app.main:app --reload --port 8001
```

---

## Next Steps

1. ✅ **You are here** - Backend running locally
2. 🎯 Test with different inputs
3. 📊 Build frontend dashboard (Next.js)
4. ☁️ Deploy to cloud
5. 📚 Add more sophisticated evaluators

---

## Project Structure

```
ai-guardian/backend/
├── app/
│   ├── main.py                  # FastAPI app
│   ├── core/
│   │   └── config.py           # Settings
│   ├── api/routes/
│   │   ├── evaluate.py         # Main evaluation endpoint
│   │   └── health.py           # Health checks
│   ├── evaluators/
│   │   ├── hallucination.py    # 🧠 Core intelligence
│   │   ├── safety.py           # 🔒 Safety checks
│   │   └── confidence.py       # 🎯 Confidence analysis
│   ├── models/
│   │   ├── request.py          # Input schemas
│   │   └── response.py         # Output schemas
│   └── services/
│       └── embedding.py        # ML model service
├── requirements.txt
└── test_api.py                 # Test script
```

---

## Questions?

Check the main README.md or open the interactive API docs at:
http://localhost:8000/api/v1/docs

---

**Built with ⚡ for production-grade AI evaluation**
