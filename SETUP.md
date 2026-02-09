# 4Ms Application Setup Guide

## Overview
This guide will help you set up and run the complete 4Ms (Multi-Model Multi-Agent Manuscript and Management System) application.

## Prerequisites
- Node.js 18+ (for frontend)
- Python 3.8+ (for backend)
- A Google Gemini API key (get one at https://makersuite.google.com/app/apikey)

## Quick Start

### 1. Install Frontend Dependencies
```bash
npm install
```

### 2. Install Backend Dependencies
```bash
# Python packages are already installed globally
# If you need to reinstall:
pip install --break-system-packages -r backend/requirements.txt
```

### 3. Configure Environment Variables

The Gemini API key is **not yet configured**. You need to:

**Edit `backend/.env`** and replace `your_gemini_api_key_here` with your actual key:
```bash
GEMINI_API_KEY=your_actual_gemini_api_key_here
PORT=8001
VITE_SUPABASE_URL=https://adpimliasbvuhpyalztj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkcGltbGlhc2J2dWhweWFsenRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MTA3NDksImV4cCI6MjA4NjE4Njc0OX0.5se6Pu8U8XQ40Sk9PZ5ZdDPkQ6vApVUHYwGfQcdi6-g
```

### 4. Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
./start.sh
```
Or manually:
```bash
cd backend
export PATH="/home/appuser/.local/bin:$PATH"
python3 main.py
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```
The frontend is already running in Bolt and will automatically connect to the backend.

## System Architecture

### Backend (Python/FastAPI) - Port 8001
- **API Documentation:** http://localhost:8001/docs
- **Health Check:** http://localhost:8001/health
- **Main Endpoints:**
  - `POST /api/figures/generate` - Generate figures
  - `POST /api/figures/generate-stream` - Generate with real-time updates (SSE)
  - `POST /api/data/upload` - Upload data files

### Frontend (React/Vite) - Port 5173
- **App:** http://localhost:5173
- Built with React, TypeScript, and Tailwind CSS
- Real-time communication with backend via Server-Sent Events

### Database (Supabase)
- PostgreSQL database for data persistence
- Authentication and user management
- File storage for generated figures

## Important Notes

### Port Configuration
- Backend runs on port **8001** (not 8000) to avoid conflicts
- Frontend runs on port **5173** (Vite default)
- These are configurable in `.env` files

### API Key Required
The backend **will not work** without a valid Gemini API key. Make sure to:
1. Get your API key from https://makersuite.google.com/app/apikey
2. Edit `backend/.env` and replace the placeholder
3. Restart the backend server

### Known Warnings
You may see a deprecation warning about `google.generativeai` package:
```
FutureWarning: All support for the google.generativeai package has ended.
Please switch to the google.genai package as soon as possible.
```
This is expected and the backend will still function. A future update will migrate to the new package.

## Troubleshooting

### Backend won't start
- Check that `GEMINI_API_KEY` is set in `backend/.env`
- Verify Python dependencies are installed
- Check that port 8001 is available

### Frontend can't connect to backend
- Ensure backend is running on port 8001
- Check `VITE_BACKEND_URL` in root `.env` file
- Verify CORS settings in backend allow your frontend origin

### Database errors
- Verify Supabase credentials in `.env` files
- Check your internet connection
- Ensure your Supabase project is active

## Development Workflow

1. **Make changes to frontend:** Files in `src/` directory
2. **Make changes to backend:** Files in `backend/` directory
3. **Database migrations:** Create SQL files in `supabase/migrations/`
4. **Test locally:** Both servers should be running
5. **Check health:** Visit http://localhost:8001/health

## Docker/Podman (Optional)

While not required in Bolt, you can containerize the application:

```dockerfile
# Example Dockerfile for backend
FROM python:3.11-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install -r requirements.txt
COPY backend/ .
CMD ["python", "main.py"]
```

For development, running directly without containers is simpler and faster.

## Next Steps

1. ✅ Set your Gemini API key in `backend/.env`
2. ✅ Start the backend: `cd backend && ./start.sh`
3. ✅ Test the API: Visit http://localhost:8001/health
4. ✅ Use the app: The frontend is already running in Bolt
5. ✅ Generate your first diagram!
