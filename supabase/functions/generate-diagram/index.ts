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

    const backendUrl = Deno.env.get("BACKEND_URL") || "http://localhost:8000";

    // Create a streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Call paperbanana backend with SSE streaming
          const response = await fetch(
            `${backendUrl}/api/paperbanana/generate`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                prompt: prompt,
                domain: domain || "general",
                aspectRatio: "16:9",
                imageSize: "2K",
                iterationLimit: 5
              })
            }
          );

          if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`Backend API error: ${response.statusText} - ${errorData}`);
          }

          // Check if response is SSE stream
          const contentType = response.headers.get("content-type");
          if (contentType?.includes("text/event-stream")) {
            // Stream SSE events from backend to frontend
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) {
              throw new Error("No response stream available");
            }

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              // Forward SSE events to frontend
              const chunk = decoder.decode(value, { stream: true });
              controller.enqueue(encoder.encode(chunk));
            }
          } else {
            // Handle non-streaming response
            const data = await response.json();

            if (data.error) {
              throw new Error(data.error);
            }

            // Send completion event
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({
                type: "complete",
                data: {
                  figure_id: crypto.randomUUID(),
                  data: {
                    image_data: data.image_data,
                    prompt: prompt,
                    type: type,
                    domain: domain,
                    model: "paperbanana",
                    iterations: data.iterations || 1
                  }
                }
              })}\n\n`)
            );
          }

          controller.close();
        } catch (error) {
          let errorMessage = error.message;
          let suggestions = [];

          // Specific error handling
          if (error.message.includes("Backend API error")) {
            errorMessage = "Backend generation service error";
            suggestions = ["Ensure backend is running", "Check backend logs"];
          } else if (error.message.includes("ECONNREFUSED") || error.message.includes("fetch failed")) {
            errorMessage = "Cannot connect to generation backend";
            suggestions = ["Start the backend server", "Check BACKEND_URL configuration"];
          } else if (error.message.includes("timeout")) {
            errorMessage = "Generation timeout - request took too long";
            suggestions = ["Try a simpler prompt", "Reduce iteration limit"];
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
