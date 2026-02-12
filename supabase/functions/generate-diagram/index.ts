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

          // Call Gemini Image Generation API
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: "status",
              data: { stage: "generating", message: "Generating diagram image...", iteration: 1 }
            })}\n\n`)
          );

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

          if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`Gemini API error: ${response.statusText} - ${errorData}`);
          }

          const data = await response.json();

          // Extract image from response
          const imagePart = data.candidates?.[0]?.content?.parts?.[0];
          let imageData = null;

          if (imagePart?.inlineData) {
            // Image is returned as inline data
            const mimeType = imagePart.inlineData.mimeType;
            const base64Data = imagePart.inlineData.data;
            imageData = `data:${mimeType};base64,${base64Data}`;
          } else if (imagePart?.text) {
            // Fallback: If model returns text instead of image
            throw new Error("Model returned text instead of image. The image generation model may not be available.");
          }

          if (!imageData) {
            throw new Error("No image data received from Gemini API");
          }

          // Send image preview with real image
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: "image_preview",
              data: {
                image_data: imageData,
                iteration: 1
              }
            })}\n\n`)
          );

          // Send completion with real image
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: "complete",
              data: {
                figure_id: crypto.randomUUID(),
                data: {
                  image_data: imageData,
                  prompt: prompt,
                  type: type,
                  domain: domain,
                  model: "gemini-2.5-flash-image"
                }
              }
            })}\n\n`)
          );

          controller.close();
        } catch (error) {
          let errorMessage = error.message;
          let suggestions = [];

          // Specific error handling
          if (error.message.includes("quota")) {
            errorMessage = "API quota exceeded";
            suggestions = ["Try again later", "Check your API plan limits"];
          } else if (error.message.includes("returned text instead of image")) {
            errorMessage = "Image generation failed - model configuration issue";
            suggestions = ["Try a simpler prompt", "Contact support"];
          } else if (error.message.includes("No image data")) {
            errorMessage = "Image generation returned empty response";
            suggestions = ["Try rephrasing your prompt", "Simplify the request"];
          } else if (error.message.includes("API error")) {
            errorMessage = "Gemini API error occurred";
            suggestions = ["Check your API key", "Try again in a moment"];
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
