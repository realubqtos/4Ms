# 4Ms Backend API

Python FastAPI backend for the 4Ms scientific figure generation platform.

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create a `.env` file:
```bash
cp .env.example .env
```

4. Add your Gemini API key to `.env`:
```
GEMINI_API_KEY=your_actual_key_here
```

## Running the Server

```bash
python main.py
```

Or with uvicorn directly:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

- `GET /` - API information
- `GET /health` - Health check
- `POST /api/figures/generate` - Generate a new figure
- `POST /api/figures/refine` - Refine an existing figure
- `POST /api/data/upload` - Upload data files for visualization

## Integration with PaperBanana

To integrate PaperBanana for actual figure generation:

1. Clone PaperBanana:
```bash
git clone https://github.com/llmsresearch/paperbanana.git
cd paperbanana
pip install -e .
```

2. Import and use in the API endpoints as needed.

## Development

The API uses FastAPI with automatic OpenAPI documentation available at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
