# Phase 1: Fix Current Diagram Generation Flow

**Goal:** Generate actual diagrams instead of placeholder SVGs
**Timeline:** 1-2 days
**Priority:** CRITICAL
**Status:** In Progress

---

## Current Problem

### What's Broken
1. Edge Function calls `gemini-3-flash-preview` (text-only model)
2. Returns hardcoded placeholder SVG in base64
3. User sees "Diagram generated successfully!" but gets placeholder image
4. Python backend with sophisticated orchestration sits idle

### Root Cause
```typescript
// Line 47: Using TEXT model instead of IMAGE model
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent`,
  // ...
)

// Lines 84-87, 97: Hardcoded placeholder SVGs
image_data: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0i..."
```

---

## Solution Overview

Replace text model with Gemini Image API to generate **actual visual diagrams**.

### Changes Required
1. Update API endpoint from `generateContent` to image generation endpoint
2. Change model from `gemini-3-flash-preview` to `gemini-2.5-flash-image`
3. Modify request payload for image generation
4. Parse image response (inline data with mimeType and base64 data)
5. Remove placeholder SVG responses
6. Return real base64-encoded image

---

## Detailed Implementation Plan

### Step 1: Update Edge Function Model

**File:** `supabase/functions/generate-diagram/index.ts`

**Current (Lines 46-77):**
```typescript
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${geminiApiKey}`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `Generate a detailed description for a ${type} figure...`
        }]
      }]
    })
  }
);
```

**New (Image Generation):**
```typescript
// Use image generation model
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${geminiApiKey}`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `Generate a high-quality scientific diagram image.

Type: ${type}
Domain: ${domain}

User request: ${prompt}

Requirements:
- Clear, publication-quality visualization
- Accurate scientific representation
- Well-labeled axes, vectors, and components
- Professional color scheme
- Readable text and annotations
- High contrast for visibility

Create the actual visual diagram, not a description.`
        }]
      }],
      generationConfig: {
        temperature: 1.0,
        topP: 0.95,
        topK: 20
      }
    })
  }
);
```

**Key Changes:**
- Model: `gemini-3-flash-preview` → `gemini-2.5-flash-image`
- Prompt: Changed from "generate description" to "generate image"
- Added `generationConfig` for better output
- Emphasized visual creation, not text description

### Step 2: Parse Image Response

**Current (Lines 72-77):**
```typescript
const data = await response.json();
const description = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
```

**New:**
```typescript
const data = await response.json();

// Extract image from response
const imagePart = data.candidates?.[0]?.content?.parts?.[0];
let imageData = null;

if (imagePart?.inlineData) {
  // Image is returned as inline data
  const mimeType = imagePart.inlineData.mimeType; // e.g., "image/png"
  const base64Data = imagePart.inlineData.data;
  imageData = `data:${mimeType};base64,${base64Data}`;
} else if (imagePart?.text) {
  // Fallback: If model returns text instead of image
  throw new Error("Model returned text instead of image. Check model name.");
}

if (!imageData) {
  throw new Error("No image data received from Gemini API");
}
```

**Key Changes:**
- Look for `inlineData` instead of `text`
- Extract `mimeType` and `data` from response
- Construct proper data URL
- Error handling if image not generated

### Step 3: Remove Placeholder SVGs

**Current (Lines 79-88):**
```typescript
controller.enqueue(
  encoder.encode(`data: ${JSON.stringify({
    type: "image_preview",
    data: {
      image_data: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0i...",
      iteration: 2
    }
  })}\n\n`)
);
```

**New:**
```typescript
// Send actual image preview
controller.enqueue(
  encoder.encode(`data: ${JSON.stringify({
    type: "image_preview",
    data: {
      image_data: imageData,  // Real image from Gemini
      iteration: 1
    }
  })}\n\n`)
);
```

**Current (Lines 90-102):**
```typescript
controller.enqueue(
  encoder.encode(`data: ${JSON.stringify({
    type: "complete",
    data: {
      figure_id: crypto.randomUUID(),
      data: {
        image_data: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0i...",
        description
      }
    }
  })}\n\n`)
);
```

**New:**
```typescript
// Send completion with real image
controller.enqueue(
  encoder.encode(`data: ${JSON.stringify({
    type: "complete",
    data: {
      figure_id: crypto.randomUUID(),
      data: {
        image_data: imageData,  // Real image from Gemini
        prompt: prompt,
        type: type,
        domain: domain,
        model: "gemini-2.5-flash-image"
      }
    }
  })}\n\n`)
);
```

### Step 4: Enhanced Error Handling

**Add specific error messages:**
```typescript
try {
  // ... generation code ...
} catch (error) {
  let errorMessage = error.message;
  let suggestions = [];

  // Specific error handling
  if (error.message.includes("quota")) {
    errorMessage = "API quota exceeded";
    suggestions = ["Try again later", "Upgrade your API plan"];
  } else if (error.message.includes("returned text instead of image")) {
    errorMessage = "Image generation failed - model configuration issue";
    suggestions = ["Contact support", "Try a simpler prompt"];
  } else if (error.message.includes("No image data")) {
    errorMessage = "Image generation returned empty response";
    suggestions = ["Try rephrasing your prompt", "Simplify the request"];
  }

  controller.enqueue(
    encoder.encode(`data: ${JSON.stringify({
      type: "error",
      data: {
        message: errorMessage,
        suggestions: suggestions,
        originalError: error.message
      }
    })}\n\n`)
  );
  controller.close();
}
```

---

## Testing Plan

### Test Case 1: Simple Force Diagram
**Prompt:** "Generate a force diagram showing projectile motion with initial velocity of 20 m/s at 45° angle, including gravity vector, velocity components, and trajectory path"

**Expected Result:**
- API returns image data
- Base64-encoded PNG or JPEG
- Visual shows projectile motion with labeled vectors
- No placeholder text visible

**Verification:**
- Check browser network tab for image data
- Verify base64 string starts with valid header
- Confirm image renders in canvas
- Check image is not SVG placeholder

### Test Case 2: Velocity Vector Diagram
**Prompt:** "Create a velocity vector diagram for circular motion"

**Expected Result:**
- Image shows circular path
- Velocity vectors tangent to circle
- Acceleration vectors toward center
- Clear labels

### Test Case 3: Error Handling
**Prompt:** "" (empty)

**Expected Result:**
- Appropriate error message
- Suggestions for user
- No crash

### Test Case 4: Complex Multi-Element Diagram
**Prompt:** "Generate a comprehensive force diagram showing a block on an inclined plane with friction, including normal force, weight components, friction force, and acceleration vectors"

**Expected Result:**
- All elements present
- Proper vector directions
- Clear labeling
- Professional appearance

---

## Validation Checklist

Before marking Phase 1 complete:

- [ ] Edge Function calls Gemini Image API (not text API)
- [ ] Model is `gemini-2.5-flash-image`
- [ ] Request prompt emphasizes image generation
- [ ] Response parsing extracts `inlineData`
- [ ] No placeholder SVGs in code
- [ ] Real base64 image data returned
- [ ] Image displays correctly in frontend canvas
- [ ] Error handling covers common failures
- [ ] Test with at least 3 different diagram types
- [ ] Build succeeds without errors

---

## Frontend Compatibility

### No Changes Required (For Now)
The frontend `DiagramProvider` already handles base64 image data:

```typescript
// src/providers/DiagramProvider.tsx
case 'complete':
  const figureId = event.data.figure_id;
  const imageData = event.data.data.image_data;  // Works with base64

  setState(prev => ({
    ...prev,
    isGenerating: false,
    imageData: imageData,  // Displays in canvas
    figureId: figureId
  }));
```

### Future Enhancement (Phase 3)
Add metadata display:
- Model used
- Generation time
- Image resolution
- Quality score

---

## Performance Expectations

### Gemini 2.5 Flash Image
- **Latency:** 2-5 seconds average
- **Success Rate:** ~95% (based on Gemini docs)
- **Image Quality:** Good for standard diagrams
- **Resolution:** 1K-2K (1024x1024 to 2048x2048)

### If Too Slow or Low Quality
Consider upgrading to `gemini-3-pro-image-preview` in Phase 2:
- **Latency:** 10-15 seconds
- **Quality:** Publication-ready
- **Resolution:** Up to 4K
- **Better for:** Complex scientific diagrams

---

## Rollback Plan

If Phase 1 implementation fails:

1. **Revert Edge Function**
   - Restore original `gemini-3-flash-preview` call
   - Keep placeholder SVGs temporarily
   - Document issues encountered

2. **Immediate Fallback: Use Python Backend**
   - Skip directly to Phase 2
   - Route all requests to Python backend
   - Use PaperBanana or DiagramOrchestrator

3. **Alternative: Static Diagrams**
   - Pre-generate common diagram types
   - Store in Supabase Storage
   - Serve based on keywords
   - Short-term solution only

---

## Success Criteria

Phase 1 is complete when:

1. ✅ User submits projectile motion prompt
2. ✅ Edge Function calls Gemini Image API
3. ✅ Real diagram image is generated (not placeholder)
4. ✅ Image displays correctly in canvas
5. ✅ User can see actual force vectors and trajectory
6. ✅ No "Diagram Generation Placeholder" text visible
7. ✅ Error cases handled gracefully
8. ✅ Build succeeds without errors

---

## Timeline

**Day 1:**
- Morning: Update Edge Function code
- Afternoon: Test and debug
- Evening: Verify multiple diagram types

**Day 2:**
- Morning: Polish error handling
- Afternoon: Documentation
- Evening: User acceptance testing

---

## Next Steps After Phase 1

Once Phase 1 is complete and validated:

1. **Document Results**
   - Screenshot successful diagrams
   - Note any quality issues
   - Measure actual latency

2. **Evaluate Quality**
   - Is Gemini 2.5 Flash Image sufficient?
   - Do we need Gemini 3 Pro Image?
   - Are diagrams scientifically accurate?

3. **Begin Phase 2 Planning**
   - If quality is good: Add complexity routing
   - If quality is poor: Fast-track Python backend
   - If inconsistent: Implement fallback strategy

4. **Update Architecture Docs**
   - Add actual performance metrics
   - Document lessons learned
   - Update timeline for remaining phases

---

## Notes

### Gemini Image API Limitations
- **Text Rendering:** Variable quality in generated diagrams
- **Mathematical Notation:** May not render LaTeX correctly
- **Data Plots:** Cannot process uploaded data files
- **Consistency:** Multiple generations of same prompt may vary

### When to Use Python Backend Instead
- User uploads data file → Use DiagramOrchestrator + Matplotlib
- Complex multi-panel figures → Use PaperBanana
- Requires exact data plotting → Use Matplotlib
- Iterative refinement needed → Use multi-agent pipeline

### Cost Considerations
- Gemini 2.5 Flash Image: ~$0.0025 per image
- Gemini 3 Pro Image: ~$0.01 per image
- Estimate 100 diagrams/day = $0.25-$1.00/day

---

## References

- [Gemini Image Generation Docs](https://ai.google.dev/gemini-api/docs/image-generation)
- [HYBRID_ARCHITECTURE_PLAN.md](./HYBRID_ARCHITECTURE_PLAN.md)
- Edge Function: `supabase/functions/generate-diagram/index.ts`
- Frontend Provider: `src/providers/DiagramProvider.tsx`

---

**End of Phase 1 Implementation Plan**
