# Hybrid Diagram Generation Architecture Plan

**Document Version:** 1.0
**Date:** February 12, 2026
**Status:** Planning Phase

---

## Executive Summary

This document outlines the comprehensive plan for implementing a **hybrid diagram generation architecture** (Option C) that combines the speed of serverless Edge Functions with the intelligence of multi-agent Python backends.

### Current Problem
- Edge Function calls text-only Gemini model (`gemini-3-flash-preview`)
- Returns hardcoded placeholder SVGs instead of actual diagrams
- Python backend with sophisticated multi-agent orchestration sits unused
- User receives "Diagram generated successfully!" but sees placeholder images

### Solution: Hybrid Architecture (Option C)
- **Simple Path:** Edge Function → Gemini Image API directly (2-5 seconds)
- **Complex Path:** Edge Function → Python Backend → Multi-agent pipeline → Gemini Image API (10-30 seconds)
- **Fallback Path:** matplotlib code generation if everything else fails

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                          │
│                    - DiagramProvider                              │
│                    - AIChatPanel                                  │
│                    - DiagramCanvas                                │
└────────────────────┬─────────────────────────────────────────────┘
                     │
                     │ WebSocket Stream
                     ↓
┌──────────────────────────────────────────────────────────────────┐
│              Edge Function (Supabase/Deno)                        │
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐     │
│  │         Complexity Analyzer                             │     │
│  │  - Keyword detection                                    │     │
│  │  - Prompt length analysis                               │     │
│  │  - Diagram type classification                          │     │
│  └─────────────┬────────────────────┬─────────────────────┘     │
│                │                    │                            │
│         SIMPLE │                    │ COMPLEX                    │
│                ↓                    ↓                            │
│  ┌──────────────────────┐  ┌──────────────────────────┐        │
│  │ Direct Image Gen     │  │  Python Backend Proxy    │        │
│  │ Gemini Image API     │  │  Forward to FastAPI      │        │
│  └──────────────────────┘  └──────────────────────────┘        │
└────────────────────┬────────────────┬────────────────────────────┘
                     │                │
                     │                │ HTTP Stream
                     │                ↓
                     │    ┌───────────────────────────────────────┐
                     │    │   Python Backend (FastAPI)            │
                     │    │                                       │
                     │    │  ┌─────────────────────────────────┐ │
                     │    │  │  PaperBananaOrchestrator        │ │
                     │    │  │  - Uses paperbanana library     │ │
                     │    │  │  - Gemini 3 Pro Image API       │ │
                     │    │  │  - Multi-agent pipeline:        │ │
                     │    │  │    → Retriever Agent            │ │
                     │    │  │    → Planner Agent              │ │
                     │    │  │    → Stylist Agent              │ │
                     │    │  │    → Visualizer Agent           │ │
                     │    │  │    → Critic Agent               │ │
                     │    │  │  - Iterative refinement (3x)    │ │
                     │    │  │  - Quality scoring              │ │
                     │    │  └─────────────────────────────────┘ │
                     │    │                                       │
                     │    │  ┌─────────────────────────────────┐ │
                     │    │  │  DiagramOrchestrator (Fallback) │ │
                     │    │  │  - Custom agents                │ │
                     │    │  │  - Matplotlib code generation   │ │
                     │    │  │  - Code execution via exec()    │ │
                     │    │  │  - PNG output                   │ │
                     │    │  └─────────────────────────────────┘ │
                     │    └───────────────────────────────────────┘
                     │                │
                     ↓                ↓
┌──────────────────────────────────────────────────────────────────┐
│                      Supabase                                     │
│  - Storage: Image files (diagrams bucket)                        │
│  - Database: figures, generations, projects tables               │
│  - RLS: User-based access control                                │
└──────────────────────────────────────────────────────────────────┘
```

---

## Agent Architecture Deep Dive

### PaperBananaOrchestrator
**Location:** `backend/agents/paperbanana_orchestrator.py`

**Configuration:**
```python
Settings(
    vlm_provider="gemini",
    vlm_model="gemini-2.0-flash",
    image_provider="google_imagen",
    image_model="gemini-3-pro-image-preview",
    refinement_iterations=3
)
```

**Pipeline Flow:**
1. **Retriever Agent** - Finds similar reference diagrams (if RAG enabled)
2. **Planner Agent** - Creates structured diagram plan
3. **Stylist Agent** - Applies visual styling and aesthetics
4. **Visualizer Agent** - Generates image via Gemini 3 Pro Image API
5. **Critic Agent** - Evaluates quality, suggests refinements
6. **Iteration Loop** - Repeats 3-5 up to 3 times for quality improvement

**Output:** High-quality, publication-ready scientific diagrams

### DiagramOrchestrator (Fallback)
**Location:** `backend/agents/orchestrator.py`

**Pipeline Flow:**
1. **Retriever Agent** - Gets reference diagrams
2. **Planner Agent** - Plans diagram structure
3. **Stylist Agent** - Defines color schemes and styling
4. **Visualizer Agent** - Generates matplotlib Python code via LLM
5. **Code Execution** - Uses `exec()` to run generated code
6. **Critic Agent** - Evaluates output

**Output:** Matplotlib-generated PNG images

### Key Difference
- **PaperBanana:** Uses Gemini's native image generation (better quality, less control)
- **DiagramOrchestrator:** Generates and executes code (more control, requires data)

---

## Routing Logic

### Complexity Detection Rules

**Simple Request → Edge Function Direct:**
- Single panel diagrams
- Standard visualizations (force diagram, velocity vector, trajectory)
- No data upload
- Prompt < 200 characters
- Keywords: "simple", "basic", "quick", "force diagram", "velocity vector"

**Complex Request → Python Backend:**
- Multi-panel figures
- Data-driven plots
- Scientific methodology diagrams
- Prompt > 200 characters
- Keywords: "multi-panel", "complex", "data-driven", "plot from data", "with calculations"
- User explicitly selects "Advanced Mode"
- File upload present

**Example Classifications:**
```
Simple: "Generate a force diagram showing projectile motion"
→ Edge Function + Gemini 2.5 Flash Image

Complex: "Generate a multi-panel force diagram showing projectile motion
with initial velocity of 20 m/s at 45° angle, including gravity vector,
velocity components, trajectory path, and calculated range"
→ Python Backend + PaperBanana + Gemini 3 Pro Image

Data-driven: "Plot this CSV data as a scatter plot with trend line"
→ Python Backend + DiagramOrchestrator + Matplotlib
```

---

## Gemini Image Generation Documentation

### Official Documentation Sources
- [Nano Banana Image Generation](https://ai.google.dev/gemini-api/docs/image-generation)
- [Generate Images using Imagen](https://ai.google.dev/gemini-api/docs/imagen)
- [Firebase AI Logic - Generate Images](https://firebase.google.com/docs/ai-logic/generate-images-gemini)
- [Vertex AI Image Generation](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/multimodal/image-generation)

### Available Models

#### gemini-2.5-flash-image
- **Purpose:** Fast, efficient image generation
- **Use case:** High-volume, low-latency tasks
- **Speed:** ~2-5 seconds
- **Resolution:** 1K, 2K
- **Best for:** Simple diagrams, quick iterations

#### gemini-3-pro-image-preview
- **Purpose:** State-of-the-art professional image generation
- **Use case:** Publication-quality assets
- **Speed:** ~10-15 seconds per image
- **Resolution:** 1K, 2K, 4K
- **Features:**
  - Advanced reasoning for complex prompts
  - Multi-turn creation and editing
  - Superior text rendering in diagrams
  - Grounding with Google Search
- **Best for:** Scientific diagrams, complex visualizations

### Key Capabilities
- **High-resolution output:** Built-in support for 1K, 2K, 4K
- **Text rendering:** Legible, stylized text for infographics, diagrams, labels
- **Grounding:** Can verify facts with Google Search
- **Iterative editing:** Multi-turn conversations for refinement
- **Safety:** SynthID watermark on all generated images

### API Endpoints

**Generate Image:**
```
POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
```

**Request Format:**
```json
{
  "contents": [{
    "parts": [{
      "text": "Generate a force diagram showing..."
    }]
  }],
  "generationConfig": {
    "temperature": 1.0,
    "topP": 0.95,
    "topK": 20,
    "maxOutputTokens": 8192
  }
}
```

**Response Format:**
```json
{
  "candidates": [{
    "content": {
      "parts": [{
        "inlineData": {
          "mimeType": "image/png",
          "data": "base64_encoded_image..."
        }
      }]
    }
  }]
}
```

---

## RAG (Retrieval-Augmented Generation) Strategy

### Level 1: Simple RAG (Recommended Starting Point)
**Implementation Complexity:** Low (2-3 days)

**Components:**
- Vector database (Supabase pgvector extension)
- Embedding model (Gemini Embedding API - free)
- Simple similarity search

**Workflow:**
1. Store reference diagrams in Supabase with embeddings
2. User submits prompt
3. Generate embedding for prompt
4. Find top 3-5 similar diagrams via vector similarity
5. Include similar diagrams as context in generation prompt
6. Generate new diagram

**Database Schema:**
```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Reference diagrams table
CREATE TABLE reference_diagrams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  diagram_type TEXT,
  domain TEXT,
  image_url TEXT,
  embedding VECTOR(768), -- Gemini embedding dimension
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for fast similarity search
CREATE INDEX ON reference_diagrams
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

**Use Cases:**
- "Generate a force diagram like the ones in my physics textbook"
- "Create a diagram similar to Figure 3.2 in Chapter 4"
- "Make a methodology diagram like my previous project"

### Level 2: Multi-Source RAG (Future Enhancement)
**Implementation Complexity:** Medium (1-2 weeks)

**Additional Components:**
- Document processing pipeline (PDF parsing, chunking)
- Multiple vector collections (physics, math, chemistry, biology)
- Reranking algorithm
- Metadata filtering

**Features:**
- Upload textbooks, papers, documents
- Extract diagrams automatically
- Chunk and index content
- Multi-source retrieval
- Context reranking

### Level 3: Agentic RAG (Advanced)
**Implementation Complexity:** High (3-4 weeks)

**Features:**
- Agent decides which knowledge sources to query
- Multi-hop reasoning
- Fact verification against sources
- Citation tracking
- Confidence scoring

**Not recommended until Level 1-2 prove valuable**

---

## Implementation Phases

### Phase 1: Fix Current Flow (1-2 days) ✓ PRIORITY
**Goal:** Generate actual diagrams instead of placeholders

**Tasks:**
1. Update Edge Function to call Gemini Image API
2. Remove placeholder SVG responses
3. Parse base64 image from API response
4. Return real images to frontend
5. Test with simple prompts

**Success Criteria:**
- Projectile motion prompt generates real diagram
- Image displays in canvas
- No placeholder text visible

### Phase 2: Add Python Backend Routing (2-3 days)
**Goal:** Implement complexity detection and backend proxy

**Tasks:**
1. Add complexity analyzer to Edge Function
2. Implement HTTP proxy to Python backend `/api/figures/generate-stream-v2`
3. Forward streaming events from backend
4. Add health check for backend availability
5. Implement fallback logic

**Success Criteria:**
- Simple prompts use Edge Function
- Complex prompts route to Python backend
- Streaming events work end-to-end
- Graceful fallback if backend unavailable

### Phase 3: Frontend Updates (2-3 days)
**Goal:** Enhanced UI for multi-agent feedback

**Tasks:**
1. Update DiagramProvider to handle both paths
2. Display agent progress (Retriever → Planner → Stylist → Visualizer → Critic)
3. Show iteration count and quality scores
4. Add "Advanced Mode" toggle
5. Display metadata (model used, generation time, quality score)

**Success Criteria:**
- User sees real-time agent activity
- Progress indicators for each agent
- Quality scores displayed
- Can toggle between simple/advanced mode

### Phase 4: Storage and Persistence (1-2 days)
**Goal:** Save generated images to Supabase Storage

**Tasks:**
1. Create `diagrams` bucket in Supabase Storage
2. Upload generated images after creation
3. Generate public URLs
4. Update `figures` table with Storage URLs
5. Implement cleanup jobs for temporary images

**Success Criteria:**
- Images saved to Storage
- Database records include Storage URLs
- Images accessible via public URLs
- Orphaned images cleaned up after 7 days

### Phase 5: Polish and Monitoring (2-3 days)
**Goal:** Production-ready system with monitoring

**Tasks:**
1. Comprehensive error handling
2. Multi-level fallback strategy
3. Telemetry and logging to Supabase
4. Admin dashboard for monitoring
5. Performance metrics tracking

**Success Criteria:**
- All error cases handled gracefully
- Logs stored in database
- Admin can monitor usage
- Performance metrics tracked

### Phase 6: Python Backend Deployment (TBD)
**Goal:** Deploy Python backend to production

**Options to Evaluate:**
1. **Podman Containers** - Self-hosted, full control
2. **Heroku** - Easy deployment, managed platform
3. **PythonAnywhere** - Python-specific hosting
4. **Cloud Run** - Serverless containers
5. **Railway** - Modern platform, simple deployment

**Requirements:**
- Support for FastAPI/Uvicorn
- WebSocket/SSE streaming support
- Environment variable management
- Reasonable pricing for scientific workloads
- Good Python 3.11+ support

**Evaluation Criteria:**
- Cost per month (estimate usage)
- Cold start time
- Streaming support
- Ease of deployment
- Scaling capabilities

### Phase 7: RAG Integration (Future)
**Goal:** Add knowledge base retrieval

**Prerequisites:**
- Phase 1-5 complete and stable
- User demand for reference-based generation
- Decision on knowledge sources

**Tasks:**
1. Enable pgvector extension in Supabase
2. Implement embedding generation
3. Create reference_diagrams table
4. Build similarity search function
5. Integrate with RetrieverAgent

---

## Environment Configuration

### Edge Function Environment Variables
```bash
# Gemini API
GEMINI_API_KEY=<your_key>

# Backend routing
PYTHON_BACKEND_URL=<backend_url>
USE_PYTHON_BACKEND=true
COMPLEXITY_THRESHOLD=200

# Model selection
SIMPLE_MODEL=gemini-2.5-flash-image
COMPLEX_MODEL=gemini-3-pro-image-preview

# Feature flags
ENABLE_COMPLEXITY_DETECTION=true
ENABLE_FALLBACK=true
```

### Python Backend Environment Variables
```bash
# Gemini API
GEMINI_API_KEY=<your_key>
GOOGLE_API_KEY=<your_key>

# Supabase
SUPABASE_URL=<your_url>
SUPABASE_ANON_KEY=<your_key>
VITE_SUPABASE_URL=<your_url>
VITE_SUPABASE_ANON_KEY=<your_key>

# PaperBanana (if using)
PAPERBANANA_API_KEY=<your_key>

# Server
PORT=8000
```

### Frontend Environment Variables
```bash
VITE_SUPABASE_URL=<your_url>
VITE_SUPABASE_ANON_KEY=<your_key>
VITE_PYTHON_BACKEND_URL=<backend_url>
```

---

## Database Schema

### figures table
```sql
CREATE TABLE figures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  project_id UUID REFERENCES projects(id),
  title TEXT,
  description TEXT,
  diagram_type TEXT,
  domain TEXT,
  image_url TEXT, -- Supabase Storage URL
  thumbnail_url TEXT,
  generation_metadata JSONB, -- Model, pipeline, iterations, quality score
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies
ALTER TABLE figures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own figures"
  ON figures FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own figures"
  ON figures FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
```

### generations table (audit trail)
```sql
CREATE TABLE generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  figure_id UUID REFERENCES figures(id),
  user_id UUID REFERENCES auth.users(id),
  prompt TEXT NOT NULL,
  diagram_type TEXT,
  domain TEXT,
  pipeline_type TEXT, -- 'edge_direct', 'paperbanana', 'matplotlib'
  model_used TEXT,
  generation_time_ms INTEGER,
  success BOOLEAN,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own generations"
  ON generations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
```

### Storage Buckets
```sql
-- Create diagrams bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('diagrams', 'diagrams', true);

-- RLS for storage
CREATE POLICY "Users can upload own diagrams"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'diagrams'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Anyone can view diagrams"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'diagrams');
```

---

## Error Handling Strategy

### Multi-Level Fallback
```
1. Try Edge Function (Gemini 2.5 Flash Image)
   ↓ fails
2. Try Python Backend (PaperBanana)
   ↓ fails
3. Try DiagramOrchestrator (Matplotlib)
   ↓ fails
4. Return helpful error with suggestions
```

### Error Classifications

**API Quota Errors:**
- Detect quota exceeded responses
- Show upgrade prompt
- Suggest trying again later

**Model Unavailable:**
- Switch to fallback model automatically
- Log model availability issues
- Notify user of degraded mode

**Timeout Errors:**
- Implement 30s timeout for Edge Function
- Implement 60s timeout for Python backend
- Offer retry or simpler mode

**Invalid Prompt:**
- Detect vague or problematic prompts
- Provide prompt improvement suggestions
- Show example prompts

**Backend Unavailable:**
- Health check before routing
- Fall back to Edge Function
- Display maintenance message

---

## Monitoring and Telemetry

### Performance Metrics to Track

**Latency:**
- Edge Function response time
- Python backend response time
- End-to-end generation time
- P50, P95, P99 percentiles

**Success Rates:**
- Overall success rate
- Success by pipeline type
- Success by diagram type
- Success by complexity

**Usage:**
- Requests per day
- Requests by user
- Requests by diagram type
- API quota consumption

**Quality:**
- Quality scores from Critic Agent
- Iteration counts
- User satisfaction (thumbs up/down)
- User refinement requests

### Logging Strategy

**Log to Supabase `logs` table:**
```sql
CREATE TABLE logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  level TEXT, -- 'info', 'warning', 'error'
  event_type TEXT, -- 'generation_start', 'generation_complete', 'error'
  message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying
CREATE INDEX logs_user_id_idx ON logs(user_id);
CREATE INDEX logs_created_at_idx ON logs(created_at DESC);
CREATE INDEX logs_event_type_idx ON logs(event_type);
```

**What to Log:**
- Generation start (user_id, prompt, type, domain)
- Routing decision (simple vs complex, reason)
- Agent completions (agent name, duration, success)
- Generation complete (figure_id, duration, quality_score)
- Errors (type, message, stack trace)
- API calls (model, tokens, cost estimate)

---

## Testing Strategy

### Unit Tests

**Edge Function:**
- Complexity analyzer logic
- API request formatting
- Response parsing
- Error handling

**Python Backend:**
- Each agent individually
- Orchestrator flow
- Code generation and execution
- Database saves

### Integration Tests

**End-to-End:**
- Frontend → Edge → Database → Storage
- Frontend → Edge → Python → Database → Storage
- Streaming event flow
- Error propagation

**Scenarios:**
1. Simple prompt → Edge Function path
2. Complex prompt → Python Backend path
3. Backend down → Fallback to Edge
4. API quota exceeded → Error handling
5. Invalid prompt → Error with suggestions

### Load Tests

**Edge Function:**
- 10 concurrent requests
- 100 requests over 1 minute
- Response time under load

**Python Backend:**
- 5 concurrent requests (limited by LLM rate limits)
- Streaming stability
- Memory usage over time

---

## PaperBanana Library Setup

### Installation Required
The PaperBanana library is **not currently installed**.

**To install:**
```bash
cd backend
pip install paperbanana
```

**Verification:**
```python
try:
    from paperbanana import PaperBananaPipeline
    print("PaperBanana available!")
except ImportError:
    print("PaperBanana not installed")
```

**Configuration:**
The orchestrator is already configured (lines 43-50 in `paperbanana_orchestrator.py`):
```python
settings = Settings(
    vlm_provider="gemini",
    vlm_model="gemini-2.0-flash",
    image_provider="google_imagen",
    image_model="gemini-3-pro-image-preview",
    refinement_iterations=3,
)
```

**Note:** Once installed, set `PAPERBANANA_AVAILABLE=True` will activate the advanced pipeline.

---

## Future Enhancements

### Short Term (3-6 months)
1. **Batch Generation** - Generate multiple variations simultaneously
2. **Style Presets** - Pre-configured styles (minimalist, detailed, colorful)
3. **Template Library** - Common diagram templates
4. **Export Options** - SVG, PDF, high-res PNG
5. **Collaboration** - Share diagrams with team members

### Medium Term (6-12 months)
1. **RAG Level 2** - Multi-source knowledge retrieval
2. **Custom Models** - Fine-tuned models for specific domains
3. **Advanced Editing** - Post-generation manual adjustments
4. **Animation** - Animated diagrams for presentations
5. **LaTeX Integration** - Export to LaTeX/TikZ

### Long Term (12+ months)
1. **RAG Level 3** - Agentic retrieval with citations
2. **Multi-Modal Input** - Sketch to diagram
3. **Video Generation** - Animated explanations
4. **AR/VR Export** - 3D scientific visualizations
5. **Academic Publishing** - Direct journal submission

---

## Success Metrics

### Technical Metrics
- **Generation Success Rate:** > 95%
- **Average Generation Time (Simple):** < 5 seconds
- **Average Generation Time (Complex):** < 30 seconds
- **Error Rate:** < 2%
- **Backend Uptime:** > 99.5%

### User Experience Metrics
- **User Satisfaction:** > 4.5/5 stars
- **Refinement Rate:** < 20% (users happy with first generation)
- **Completion Rate:** > 90% (users complete diagram workflow)
- **Return Rate:** > 60% (users return within 7 days)

### Business Metrics
- **Daily Active Users:** Track growth
- **Diagrams Per User:** Average engagement
- **Conversion Rate:** Free to paid (if applicable)
- **Cost Per Generation:** Optimize API costs

---

## Open Questions & Decisions Needed

### Deployment
- [ ] Choose Python backend hosting platform
- [ ] Decide on container orchestration (if any)
- [ ] Plan for scaling strategy
- [ ] Estimate monthly infrastructure costs

### PaperBanana
- [ ] Install and test PaperBanana library
- [ ] Verify Gemini 3 Pro Image API access
- [ ] Test quality vs speed tradeoffs
- [ ] Evaluate if worth the complexity

### RAG
- [ ] Decide if RAG is needed (hold for now)
- [ ] Identify knowledge sources if implementing
- [ ] Determine storage requirements for embeddings
- [ ] Plan for document processing pipeline

### Pricing
- [ ] Track Gemini API costs per diagram type
- [ ] Estimate backend hosting costs
- [ ] Decide on free tier limits
- [ ] Plan pricing tiers if monetizing

---

## Appendix

### Related Files
- `supabase/functions/generate-diagram/index.ts` - Edge Function
- `backend/main.py` - FastAPI server
- `backend/agents/paperbanana_orchestrator.py` - PaperBanana pipeline
- `backend/agents/orchestrator.py` - DiagramOrchestrator
- `backend/agents/visualizer_agent.py` - Matplotlib code generation
- `src/providers/DiagramProvider.tsx` - Frontend diagram state
- `src/components/chat/AIChatPanel.tsx` - Chat interface
- `src/components/canvas/DiagramCanvas.tsx` - Canvas display

### Key Dependencies
- **Frontend:** React, Supabase JS Client, React Router
- **Edge Function:** Deno, Supabase Functions
- **Backend:** FastAPI, Uvicorn, Google Generative AI, Matplotlib, Pandas
- **Database:** Supabase (PostgreSQL + pgvector)
- **Storage:** Supabase Storage

### External APIs
- Gemini 2.5 Flash Image API
- Gemini 3 Pro Image API
- Gemini Embedding API (for RAG)
- PaperBanana Library (if installed)

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-12 | System | Initial comprehensive plan created |

---

**End of Document**
