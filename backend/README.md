# ResistomeX Backend & AI Inference Service

Production FastAPI service for pre-culture Antimicrobial Resistance (AMR) risk stratification, TreeSHAP explainability, rule-filtered empiric antibiotic recommendations, and clinical decision support.

## Architecture
```
backend/
├── app/
│   ├── main.py              # FastAPI application entrypoint
│   ├── api/                 # REST API endpoints (/amr/predict, /amr/explain, /treatment/support, /decisions)
│   ├── ai/                  # Core ML & NLP pipeline (data, modeling, SHAP, LLM, validation)
│   ├── services/            # Business logic & ModelRegistry singleton
│   ├── schemas/             # Pydantic request/response validation schemas
│   └── core/                # Settings & structured logging
├── models/                  # Serialized XGBoost models, preprocessor, and metadata
├── config/                  # Feature mappings & pipeline YAML configs
├── train.py                 # Training entrypoint CLI
├── evaluate.py              # Evaluation entrypoint CLI
└── requirements.txt         # Runtime dependencies
```

## Running the Backend Server
```bash
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Interactive API documentation will be available at:
- Swagger UI: `http://localhost:8000/docs`
- Redoc: `http://localhost:8000/redoc`
- Health Check: `http://localhost:8000/health`
