# 4Ms Development Guide
## For No-to-Low Code Teams

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Key Challenges & Solutions](#key-challenges--solutions)
3. [Technology Stack Integration](#technology-stack-integration)
4. [Best Practices](#best-practices)
5. [Common Pitfalls](#common-pitfalls)

---

## Architecture Overview

### The Three-Layer System

Our application uses a hybrid architecture with three distinct layers:

```
┌─────────────────────────────────────────┐
│  Frontend (TypeScript + React + Vite)   │
│  - User interface                       │
│  - Real-time updates                    │
│  - Authentication flows                 │
└──────────────┬──────────────────────────┘
               │
               ├──────────────────────────────────┐
               │                                  │
┌──────────────▼─────────────────┐  ┌────────────▼──────────────┐
│  Supabase Edge Functions       │  │  Python Backend (FastAPI) │
│  (Deno + TypeScript)            │  │  - Multi-agent system     │
│  - generate-diagram             │  │  - PaperBanana logic      │
│  - Calls Gemini API             │  │  - Orchestration          │
└──────────────┬─────────────────┘  └────────────┬──────────────┘
               │                                  │
               └────────────┬─────────────────────┘
                            │
               ┌────────────▼──────────────┐
               │  Supabase PostgreSQL      │
               │  - User data              │
               │  - Projects & diagrams    │
               │  - Conversations          │
               └───────────────────────────┘
```

---

## Key Challenges & Solutions

### Challenge 1: TypeScript, Python, and FastAPI Integration

**The Problem:**
We had three different languages/runtimes that needed to work together:
- **Frontend TypeScript**: React application
- **Edge Functions TypeScript**: Deno runtime (different from Node.js)
- **Backend Python**: FastAPI service with multi-agent system

**Initial Confusion:**
When starting, it wasn't clear which backend to use for what purpose. We had both FastAPI endpoints and Edge Functions, leading to:
- Duplicate logic
- Unclear responsibility boundaries
- API endpoint confusion

**The Solution:**

We established clear responsibility boundaries:

| Layer | Purpose | When to Use |
|-------|---------|-------------|
| **Edge Functions** | Lightweight, serverless tasks that need to access external APIs securely | - Calling third-party APIs (Gemini)<br>- Webhooks<br>- Simple transformations |
| **Python Backend** | Complex logic, multi-step processing, agent orchestration | - PaperBanana multi-agent system<br>- Complex business logic<br>- Long-running processes |
| **Frontend TypeScript** | User interface, client-side state, direct Supabase queries | - Authentication UI<br>- Real-time updates<br>- Simple CRUD operations |

**Key Decision:**
We route diagram generation through the Edge Function to keep API keys secure, while the Python backend handles the complex multi-agent orchestration when needed.

---

### Challenge 2: CORS Issues Between Services

**The Problem:**
Frontend requests to Edge Functions were failing with CORS errors.

**The Solution:**
Every Edge Function MUST include these exact headers:

```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Handle preflight
if (req.method === "OPTIONS") {
  return new Response(null, { status: 200, headers: corsHeaders });
}

// Include in all responses
return new Response(JSON.stringify(data), {
  headers: { ...corsHeaders, "Content-Type": "application/json" }
});
```

**Critical:** The `X-Client-Info` and `Apikey` headers are required for Supabase client compatibility.

---

### Challenge 3: Gemini Model Versioning

**The Problem:**
Our diagram generation was stuck in "Planning diagram..." state because the Gemini API model was outdated.

**The Solution:**
Updated from `gemini-2.0-flash` to `gemini-3-flash-preview`.

**Lesson Learned:**
- Always check Google's documentation for latest model names
- Keep model versions as configuration, not hardcoded
- Monitor for deprecation notices

**Current Implementation:**
```typescript
const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${geminiApiKey}`;
```

---

### Challenge 4: Environment Variables Across Layers

**The Problem:**
Managing secrets across three different runtimes (Vite, Deno, Python).

**The Solution:**

| Runtime | Prefix | Access Method | Example |
|---------|--------|---------------|---------|
| **Vite (Frontend)** | `VITE_` | `import.meta.env.VITE_*` | `VITE_SUPABASE_URL` |
| **Deno (Edge Functions)** | None | `Deno.env.get()` | Auto-injected by Supabase |
| **Python (FastAPI)** | None | `os.getenv()` | `.env` file |

**Important Notes:**
- Edge Functions have Supabase credentials auto-injected
- Never commit `.env` files
- Frontend env vars are exposed in client bundle (use only for public values)

---

### Challenge 5: Type Safety Across the Stack

**The Problem:**
Database schema changes broke the frontend without warning.

**The Solution:**
Generate TypeScript types from Supabase schema:

```bash
# After any migration
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
```

**Benefits:**
- Compile-time checks for database queries
- Autocomplete for table columns
- Catch schema mismatches early

---

## Technology Stack Integration

### Frontend → Supabase (Direct)
```typescript
// For simple CRUD operations
const { data, error } = await supabase
  .from('projects')
  .select('*')
  .eq('user_id', userId);
```

**Use When:** Simple reads/writes, authentication, real-time subscriptions

---

### Frontend → Edge Function
```typescript
// For external API calls (keeps keys secure)
const response = await fetch(
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-diagram`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt, conversationId }),
  }
);
```

**Use When:** Need to call third-party APIs securely, lightweight serverless tasks

---

### Frontend → Python Backend
```typescript
// For complex multi-agent processing
const response = await fetch('http://localhost:8000/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query, options }),
});
```

**Use When:** Complex orchestration, multi-step agent workflows, PaperBanana system

---

## Best Practices

### 1. Database Operations

**Always Use RLS (Row Level Security):**
```sql
-- Enable RLS on every table
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create restrictive policies
CREATE POLICY "Users can only view own projects"
  ON projects FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
```

**Use `maybeSingle()` not `single()`:**
```typescript
// Good - returns null if not found
const { data } = await supabase
  .from('users')
  .select()
  .eq('id', userId)
  .maybeSingle();

// Bad - throws error if not found
const { data } = await supabase
  .from('users')
  .select()
  .eq('id', userId)
  .single();
```

---

### 2. Edge Function Development

**Always Handle OPTIONS Requests:**
```typescript
if (req.method === "OPTIONS") {
  return new Response(null, { status: 200, headers: corsHeaders });
}
```

**Wrap Everything in Try-Catch:**
```typescript
Deno.serve(async (req: Request) => {
  try {
    // Your logic here
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
```

---

### 3. Error Handling

**Frontend Pattern:**
```typescript
try {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return { data, error: null };
} catch (error) {
  console.error('Request failed:', error);
  return { data: null, error: error.message };
}
```

---

### 4. Migration Best Practices

**Every Migration Must:**
1. Start with a detailed comment explaining changes
2. Use `IF NOT EXISTS` / `IF EXISTS` for idempotency
3. Include RLS policies
4. Have meaningful default values
5. Be reversible (or documented as one-way)

**Example:**
```sql
/*
  # Add user preferences

  1. Changes
    - Add preferences column to users table
    - Set sensible defaults

  2. Security
    - Users can only update their own preferences
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'preferences'
  ) THEN
    ALTER TABLE users ADD COLUMN preferences jsonb DEFAULT '{"theme": "dark"}'::jsonb;
  END IF;
END $$;
```

---

## Common Pitfalls

### 1. Forgetting to Redeploy Edge Functions
**Problem:** You update the code but forget to deploy.
**Solution:** After changes, always run the deployment process.

---

### 2. Mixing Runtime APIs
**Problem:** Using Node.js APIs in Edge Functions (which use Deno).
**Solution:** Use Web APIs or Deno-specific APIs. Check [Deno docs](https://deno.land/manual).

---

### 3. Hardcoding URLs
**Problem:** `http://localhost:3000` in production.
**Solution:** Use environment variables everywhere.

---

### 4. Skipping RLS
**Problem:** Tables without RLS are fully accessible.
**Solution:** Enable RLS on EVERY table, then add specific policies.

---

### 5. Not Testing Auth States
**Problem:** Features break for logged-out users.
**Solution:** Always test as:
- Logged out user
- Regular logged in user
- Admin user
- User trying to access others' data

---

## AI Knowledge Base & Diagram Generation

### How Gemini Generates Diagrams

**Knowledge Source:**
Gemini uses its pre-trained knowledge base which includes:
- Scientific concepts (physics, mathematics, biology, etc.)
- Common diagram patterns and conventions
- Visual representation best practices
- Domain-specific visualization techniques

**It Does NOT:**
- Access external databases
- Search the web during generation
- Use retrieval-augmented generation (RAG) by default

**What We Send:**
```json
{
  "prompt": "Generate a force diagram for projectile motion",
  "conversationId": "uuid",
  "history": [/* previous messages */]
}
```

**What We Get Back:**
```json
{
  "type": "svg",
  "data": "<svg>...</svg>",
  "metadata": {
    "title": "Projectile Motion Forces",
    "description": "..."
  }
}
```

### Improving Diagram Quality

**Strategy 1: Better Prompts**
```typescript
// Vague
"make a diagram about physics"

// Specific
"Generate a force diagram showing projectile motion with initial velocity of 20 m/s at 45° angle, including gravity vector, velocity components, and trajectory path"
```

**Strategy 2: Context History**
Include previous conversation messages so Gemini understands the full context.

**Strategy 3: Style Constraints**
Add style requirements to prompts:
- "Use blue for vectors, red for forces"
- "Include a coordinate system"
- "Label all components clearly"

---

## Debugging Tips

### Frontend Issues
```typescript
// Add verbose logging
console.log('Request:', { url, method, body });
console.log('Response:', { status: response.status, data });
```

### Edge Function Issues
```bash
# Check deployment logs
# Look for function invocation errors
# Check Supabase dashboard > Edge Functions
```

### Database Issues
```typescript
// Always log errors
const { data, error } = await supabase.from('table').select();
if (error) {
  console.error('DB Error:', error);
}
```

### Python Backend Issues
```bash
# Check server logs
tail -f backend/server.log

# Test endpoints directly
curl -X POST http://localhost:8000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"query": "test"}'
```

---

## Questions & Support

**For Architecture Questions:** Review this guide's architecture diagram
**For Type Errors:** Regenerate types from Supabase schema
**For CORS Errors:** Check Edge Function headers
**For Auth Issues:** Verify RLS policies
**For API Failures:** Check environment variables

---

## Quick Reference

### Essential Commands
```bash
# Frontend
npm run dev          # Start dev server (port 5173)
npm run build        # Build for production

# Backend (Python)
cd backend
python main.py       # Start FastAPI server (port 8000)

# Database
# Migrations are applied via Supabase MCP tools
```

### Essential Files
```
.env                          # Environment variables
src/providers/supabase.ts     # Supabase client setup
src/types/database.ts         # Generated DB types
backend/main.py               # Python API entry
backend/agents/               # Agent system
supabase/functions/           # Edge Functions
supabase/migrations/          # Database migrations
```

---

**Last Updated:** 2026-02-12
**Maintainers:** Development Team
**Version:** 1.0
