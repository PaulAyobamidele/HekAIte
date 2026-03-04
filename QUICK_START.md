# PHASE 1 QUICK START

## 🚀 30-Second Setup

### Option 1: Docker (Recommended)
```bash
docker-compose up -d

# In another terminal
docker exec ai-guardian-api python manage.py init-db
docker exec ai-guardian-api python manage.py create-user
docker exec ai-guardian-api python manage.py create-api-key --username <username> --key-name "dev"

# API ready at http://localhost:8000
```

### Option 2: Local Development
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

python manage.py init-db
python manage.py create-user
python manage.py create-api-key --username <username> --key-name "dev"

uvicorn app.main:app --reload
```

## 📋 Test the API

```bash
# Get your API key from the previous step
export API_KEY="sk_your_key_here"

# Evaluate something
curl -X POST http://localhost:8000/api/v1/evaluate \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "What is the capital of Germany?",
    "model_output": "The capital of Germany is Berlin, a historic city.",
    "context": ["Berlin is the capital of Germany."]
  }'
```

## ✅ Run Tests

```bash
cd backend
pytest                      # All tests
pytest -v                   # Verbose
pytest --cov=app           # With coverage
```

## 📚 Database Management

```bash
python manage.py init-db                    # Create tables
python manage.py create-user                # Create user
python manage.py create-api-key             # Create API key
python manage.py list-api-keys              # List keys
python manage.py revoke-api-key             # Disable key
```

## 🐳 Docker Commands

```bash
docker-compose up -d                    # Start services
docker-compose down                     # Stop services
docker-compose logs -f api              # View API logs
docker exec ai-guardian-api pytest      # Run tests in container
```

## 📊 API Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/v1/health` | GET | No | Health check |
| `/api/v1/ping` | GET | No | Ping endpoint |
| `/api/v1/evaluate` | POST | Yes | Evaluate LLM output |
| `/api/v1/evaluators/status` | GET | No | Evaluators status |

## 🔑 API Key Generation

```python
import requests

# Create user
# python manage.py create-user
# Email: admin@example.com
# Username: admin
# Password: password123

# Create API key
# python manage.py create-api-key --username admin --key-name test
# Key: sk_xxxxx...

# Use in requests
headers = {"X-API-Key": "sk_xxxxx..."}
response = requests.post(
    "http://localhost:8000/api/v1/evaluate",
    json={...},
    headers=headers
)
```

## 🗄️ Database Access

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.database import User, Evaluation

# Local development
DATABASE_URL = "sqlite:///./test.db"

# Docker
DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/ai_guardian"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

db = SessionLocal()
users = db.query(User).all()
evals = db.query(Evaluation).filter_by(user_id="user_id").all()
```

## 📈 What's Included

✅ PostgreSQL database
✅ Redis caching
✅ FastAPI backend
✅ Swagger documentation
✅ API key authentication
✅ User management
✅ 46+ tests
✅ Docker containerization
✅ Health checks
✅ Logging
✅ Error handling

## 🔗 Documentation

- **API Reference**: http://localhost:8000/api/v1/docs
- **ReDoc**: http://localhost:8000/api/v1/redoc
- **Phase 1 Summary**: [PHASE1_IMPLEMENTATION.md](PHASE1_IMPLEMENTATION.md)
- **Completion Guide**: [docs/guides/PHASE1_COMPLETION.md](docs/guides/PHASE1_COMPLETION.md)

## 🚨 Troubleshooting

**Port 8000 already in use?**
```bash
uvicorn app.main:app --reload --port 8001
```

**Database connection error?**
```bash
# Check if PostgreSQL is running
docker-compose ps

# Or use SQLite (development only)
DATABASE_URL=sqlite:///./test.db uvicorn app.main:app
```

**API key not working?**
```bash
# Verify API key is active
python manage.py list-api-keys --username <username>

# Revoke and create new one
python manage.py revoke-api-key --key-id <key_id>
python manage.py create-api-key --username <username> --key-name "new"
```

## 📦 Environment Variables

```bash
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=your-secret-key
API_V1_PREFIX=/api/v1
HALLUCINATION_THRESHOLD=0.7
SAFETY_THRESHOLD=0.8
```

---

**Everything is production-ready!** 🎉

Phase 1 is complete. Ready for Phase 2: Frontend Dashboard.
