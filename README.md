# 🛡️ AI Guardian

> **Production-grade AI evaluation SaaS for monitoring LLM outputs**

AI Guardian is a post-generation evaluation platform that analyzes LLM outputs for hallucinations, safety violations, factual consistency, and confidence scoring.

## 🎯 What This Does

This is **not** a chatbot or LLM wrapper.

This is an **observability platform** for AI systems — think Datadog for LLM outputs.

### Core Capabilities

- 🧠 **Hallucination Detection**: Identifies unsupported claims in LLM responses
- 🔒 **Safety Classification**: Detects policy violations and harmful content  
- 📚 **Factual Consistency**: Verifies claims against provided sources
- 🎯 **Confidence Scoring**: Analyzes linguistic markers of uncertainty

## 🏗️ Architecture

```
Frontend (Next.js) → API Gateway (FastAPI) → Evaluation Engine (Python) → PostgreSQL + Redis
```

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Redis 7+

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/ai-guardian.git
cd ai-guardian

# Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Frontend setup
cd ../frontend
npm install

# Start services
docker-compose up -d  # Starts PostgreSQL + Redis
```

### Running Locally

```bash
# Terminal 1: Backend
cd backend
uvicorn app.main:app --reload

# Terminal 2: Frontend  
cd frontend
npm run dev
```

## 📡 API Usage

```python
import requests

response = requests.post(
    "http://localhost:8000/api/v1/evaluate",
    json={
        "prompt": "What is the capital of France?",
        "model_output": "The capital of France is Paris, located on the Seine River.",
        "context": ["Paris is the capital and largest city of France."],
        "metadata": {"model": "gpt-4", "temperature": 0.7}
    },
    headers={"X-API-Key": "your-api-key"}
)

print(response.json())
```

## 🎯 Project Goals

This is a **portfolio project** demonstrating:

- Production-grade API design
- Real-world ML system architecture  
- Cloud deployment best practices
- SaaS product thinking

## 📚 Documentation

- [API Reference](./docs/api/README.md)
- [Architecture Overview](./docs/architecture/README.md)
- [Development Guide](./docs/guides/development.md)

## 🛠️ Tech Stack

**Backend**: FastAPI, Python 3.11, SQLAlchemy, Pydantic
**ML**: Sentence Transformers, Hugging Face, scikit-learn
**Database**: PostgreSQL (pgvector), Redis
**Frontend**: Next.js 14, TypeScript, Tailwind CSS
**Deployment**: Docker, AWS/Railway

## 📄 License

MIT License - see [LICENSE](LICENSE) for details

---

Built with ⚡ for production-grade AI evaluation
