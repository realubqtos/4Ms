import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { prompt, type, domain, user_id, project_id, data_info } = await req.json();

    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY not configured");
    }

    // Create a streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial status
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: "status",
              data: { stage: "init", message: "Starting generation...", iteration: 0 }
            })}\n\n`)
          );

          // Call Gemini API
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: "status",
              data: { stage: "planning", message: "Planning diagram...", iteration: 1 }
            })}\n\n`)
          );

          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${geminiApiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{
                  parts: [{
                    text: `Generate a detailed description for a ${type} figure in the ${domain} domain.

User prompt: ${prompt}

Provide a structured description that includes:
1. Figure type and purpose
2. Key elements to include
3. Layout and composition suggestions
4. Color scheme recommendations
5. Labels and annotations needed

Format the response as a detailed technical specification.`
                  }]
                }]
              })
            }
          );

          if (!response.ok) {
            throw new Error(`Gemini API error: ${response.statusText}`);
          }

          const data = await response.json();
          const description = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated";

          // Send image preview (placeholder for now)
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: "image_preview",
              data: {
                image_data: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzMzMyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+RGlhZ3JhbSBHZW5lcmF0aW9uIFBsYWNlaG9sZGVyPC90ZXh0Pjwvc3ZnPg==",
                iteration: 2
              }
            })}\n\n`)
          );

          // Send completion
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: "complete",
              data: {
                figure_id: crypto.randomUUID(),
                data: {
                  image_data: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzMzMyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+RGlhZ3JhbSBHZW5lcmF0ZWQ8L3RleHQ+PHRleHQgeD0iNTAlIiB5PSI2MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+JHt0eXBlfSAtICR7ZG9tYWlufTwvdGV4dD48L3N2Zz4=",
                  description
                }
              }
            })}\n\n`)
          );

          controller.close();
        } catch (error) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: "error",
              data: { message: error.message }
            })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
