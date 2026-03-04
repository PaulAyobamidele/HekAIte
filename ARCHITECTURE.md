# 🏗️ AI Guardian Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                       USER / CLIENT                          │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ HTTP POST /api/v1/evaluate
                 │
┌────────────────▼────────────────────────────────────────────┐
│                    FastAPI Gateway                           │
│  • Request validation (Pydantic)                            │
│  • CORS handling                                             │
│  • API documentation                                         │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ Orchestrates evaluation pipeline
                 │
┌────────────────▼────────────────────────────────────────────┐
│               EVALUATION ENGINE (Parallel)                   │
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │  Hallucination   │  │    Safety        │                │
│  │    Detector      │  │  Classifier      │                │
│  │                  │  │                  │                │
│  │ • Embed claims   │  │ • Keyword scan   │                │
│  │ • Embed context  │  │ • Pattern match  │                │
│  │ • Cosine sim     │  │ • PII detection  │                │
│  │ • Find gaps      │  │ • Category score │                │
│  └──────────────────┘  └──────────────────┘                │
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │   Confidence     │  │  Risk Aggregator │                │
│  │     Scorer       │  │                  │                │
│  │                  │  │ • Compute risk   │                │
│  │ • Hedge detect   │  │ • Recommend act  │                │
│  │ • Uncertainty    │  │ • Generate sum   │                │
│  │ • Qualifiers     │  │                  │                │
│  └──────────────────┘  └──────────────────┘                │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ Return EvaluationResponse
                 │
┌────────────────▼────────────────────────────────────────────┐
│                   STRUCTURED RESPONSE                        │
│  • Overall risk level                                        │
│  • Recommended action                                        │
│  • Individual scores (hallucination, safety, confidence)    │
│  • Explanations & evidence                                   │
│  • Processing time & metadata                                │
└──────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### 1. Request Input
```json
{
  "prompt": "User's question",
  "model_output": "LLM's answer",
  "context": ["Supporting docs"],
  "metadata": {...}
}
```

### 2. Hallucination Detection
```
model_output → split_sentences → embed_each
context → embed_each
→ compute_cosine_similarity
→ identify_unsupported_claims
→ score = unsupported_ratio
```

### 3. Safety Classification
```
model_output → check_keywords(toxicity, violence, etc.)
           → detect_pii_patterns
           → score = 1 - max_violation
```

### 4. Confidence Analysis
```
model_output → find_hedging_words
           → find_uncertainty_markers
           → find_definitive_language
           → score = base - penalties + bonuses
```

### 5. Risk Aggregation
```
all_scores → determine_risk_level
          → recommend_action
          → generate_summary
```

### 6. Response Output
```json
{
  "overall_risk": "low",
  "recommended_action": "allow",
  "hallucination": {...},
  "safety": {...},
  "confidence": {...},
  "summary": "..."
}
```

---

## Component Details

### Hallucination Detector

**Purpose:** Identify claims not supported by provided context

**Method:**
- Sentence Transformers (all-MiniLM-L6-v2)
- Semantic similarity via cosine distance
- Threshold-based claim verification

**Key Metric:** Coverage ratio (% of claims with support)

---

### Safety Classifier

**Purpose:** Detect harmful content and policy violations

**Method (MVP):**
- Keyword matching (toxicity, violence, etc.)
- Regex patterns (PII detection)
- Category scoring

**Production Enhancement:**
- Fine-tuned BERT classifiers
- LLM-as-judge for nuanced cases

**Key Metric:** Safety score (0 = unsafe, 1 = safe)

---

### Confidence Scorer

**Purpose:** Assess linguistic confidence independent of correctness

**Method:**
- Hedging language detection
- Uncertainty marker identification
- Definitive statement recognition

**Key Insight:** High confidence ≠ correctness

**Key Metric:** Confidence score (0 = uncertain, 1 = confident)

---

## Technical Stack

| Component | Technology | Why |
|-----------|-----------|-----|
| API Framework | FastAPI | Async, fast, auto-docs |
| Request/Response | Pydantic | Type safety, validation |
| Embeddings | Sentence Transformers | Semantic similarity |
| ML Backend | PyTorch | Model inference |
| Logging | Loguru | Clean, colored logs |
| Testing | pytest | Standard Python testing |

---

## Performance Characteristics

| Metric | Value | Notes |
|--------|-------|-------|
| Response time | 200-500ms | Depends on text length |
| Embedding size | 384 dims | MiniLM-L6-v2 |
| Model size | ~80MB | Cached after first load |
| Memory usage | ~500MB | With models loaded |
| Concurrent requests | Limited by CPU | No GPU required |

---

## Design Decisions

### Why Semantic Similarity (Not Exact Matching)?

**Problem:** LLMs paraphrase - exact string matching fails.

**Solution:** Embeddings capture meaning, not just words.

**Example:**
- Context: "Paris is the capital of France"
- Output: "France's capital city is Paris"
- Exact match: ❌
- Semantic match: ✅

---

### Why Multiple Evaluators?

**Principle:** Single metric ≠ complete picture

| Evaluator | Measures | Miss Alone |
|-----------|----------|------------|
| Hallucination | Factual grounding | Could be toxic but true |
| Safety | Harmful content | Could be safe but wrong |
| Confidence | Linguistic certainty | Could be confident but hallucinated |

**Together:** Comprehensive risk assessment

---

### Why No Fine-tuning (Yet)?

**MVP Focus:** Prove the concept works

**Current approach:**
- Pre-trained models (zero-shot)
- Rule-based systems
- Semantic similarity

**Production path:**
- Fine-tune on domain data
- Add LLM-as-judge for edge cases
- Build human-in-the-loop feedback

---

## Scalability Considerations

### Current (MVP)

- ✅ Single-instance deployment
- ✅ In-memory processing
- ✅ No database required

### Future (Production)

- 🚀 Horizontal scaling (multiple workers)
- 💾 PostgreSQL for audit logs
- 🔥 Redis for caching
- 📊 Metrics & monitoring
- 🌐 CDN for model artifacts

---

## Security Considerations

### Current

- Input validation via Pydantic
- CORS middleware
- Rate limiting (TODO)

### Production

- API key authentication
- Request signing
- Encrypted data in transit (TLS)
- Audit logging
- PII scrubbing

---

## What This Architecture Enables

✅ **Observability** - Monitor LLM outputs in production
✅ **Risk management** - Catch issues before users see them
✅ **Compliance** - Audit trail for regulated industries
✅ **Quality control** - Maintain output standards
✅ **A/B testing** - Compare model versions

---

**This is production-thinking applied to AI systems.**
