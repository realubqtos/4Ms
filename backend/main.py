from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List
import os
import json
import pandas as pd
import io
from dotenv import load_dotenv
import google.generativeai as genai
from supabase import create_client, Client
from agents.orchestrator import DiagramOrchestrator

load_dotenv()

app = FastAPI(title="4Ms API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

gemini_api_key = os.getenv("GEMINI_API_KEY")
supabase_url = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_ANON_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

if gemini_api_key:
    genai.configure(api_key=gemini_api_key)

supabase: Client = None
if supabase_url and supabase_key:
    supabase = create_client(supabase_url, supabase_key)

orchestrator = None
if supabase and gemini_api_key:
    orchestrator = DiagramOrchestrator(supabase)


class FigureRequest(BaseModel):
    prompt: str
    type: str
    domain: str
    parameters: Optional[dict] = {}


class FigureResponse(BaseModel):
    figure_id: str
    file_url: str
    thumbnail_url: Optional[str] = None
    metadata: dict


@app.get("/")
async def root():
    return {
        "message": "4Ms API - Scientific Figure Generation",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "gemini_configured": gemini_api_key is not None,
        "supabase_configured": supabase is not None,
        "orchestrator_ready": orchestrator is not None
    }


@app.post("/api/figures/generate")
async def generate_figure(request: FigureRequest):
    if not gemini_api_key:
        raise HTTPException(
            status_code=500,
            detail="Gemini API key not configured"
        )

    try:
        model = genai.GenerativeModel('gemini-pro')

        prompt_template = f"""
        Generate a detailed description for a {request.type} figure in the {request.domain} domain.

        User prompt: {request.prompt}

        Provide a structured description that includes:
        1. Figure type and purpose
        2. Key elements to include
        3. Layout and composition suggestions
        4. Color scheme recommendations
        5. Labels and annotations needed

        Format the response as a detailed technical specification.
        """

        response = model.generate_content(prompt_template)

        return {
            "status": "success",
            "description": response.text,
            "type": request.type,
            "domain": request.domain,
            "message": "Figure description generated. Integration with PaperBanana for actual figure generation will be added."
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating figure: {str(e)}"
        )


@app.post("/api/figures/refine")
async def refine_figure(
    figure_id: str,
    feedback: str,
    parameters: Optional[dict] = None
):
    if not gemini_api_key:
        raise HTTPException(
            status_code=500,
            detail="Gemini API key not configured"
        )

    try:
        model = genai.GenerativeModel('gemini-pro')

        prompt = f"""
        Refine a scientific figure based on the following feedback:

        Feedback: {feedback}

        Provide specific suggestions for:
        1. Visual improvements
        2. Data presentation enhancements
        3. Clarity and readability improvements
        4. Scientific accuracy considerations
        """

        response = model.generate_content(prompt)

        return {
            "status": "success",
            "figure_id": figure_id,
            "refinement_suggestions": response.text
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error refining figure: {str(e)}"
        )


@app.post("/api/data/upload")
async def upload_data(file: UploadFile = File(...)):
    try:
        content = await file.read()

        file_extension = file.filename.split('.')[-1].lower() if file.filename else ''

        if file_extension not in ['csv', 'json', 'xlsx']:
            raise HTTPException(
                status_code=400,
                detail="Unsupported file type. Please upload CSV, JSON, or XLSX files."
            )

        data_info = {}
        if file_extension == 'csv':
            df = pd.read_csv(io.BytesIO(content))
            data_info = {
                'columns': df.columns.tolist(),
                'row_count': len(df),
                'dtypes': df.dtypes.astype(str).tolist(),
                'sample': df.head(5).to_dict('records')
            }
        elif file_extension == 'json':
            data = json.loads(content.decode('utf-8'))
            if isinstance(data, list) and len(data) > 0:
                data_info = {
                    'columns': list(data[0].keys()) if isinstance(data[0], dict) else [],
                    'row_count': len(data)
                }
        elif file_extension == 'xlsx':
            df = pd.read_excel(io.BytesIO(content))
            data_info = {
                'columns': df.columns.tolist(),
                'row_count': len(df),
                'dtypes': df.dtypes.astype(str).tolist()
            }

        return {
            "status": "success",
            "filename": file.filename,
            "size": len(content),
            "type": file_extension,
            "data_info": data_info,
            "message": "File uploaded and processed successfully."
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error uploading file: {str(e)}"
        )


class StreamingDiagramRequest(BaseModel):
    prompt: str
    type: str
    domain: str
    user_id: str
    project_id: Optional[str] = None
    data_info: Optional[dict] = None


@app.post("/api/figures/generate-stream")
async def generate_figure_stream(request: StreamingDiagramRequest):
    if not orchestrator:
        raise HTTPException(
            status_code=500,
            detail="Orchestrator not initialized. Check API keys configuration."
        )

    async def event_generator():
        try:
            async for event in orchestrator.generate_diagram(
                prompt=request.prompt,
                diagram_type=request.type,
                domain=request.domain,
                user_id=request.user_id,
                project_id=request.project_id,
                data_info=request.data_info
            ):
                yield f"data: {json.dumps(event)}\n\n"
        except Exception as e:
            error_event = {
                'type': 'error',
                'data': {'message': str(e)}
            }
            yield f"data: {json.dumps(error_event)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
