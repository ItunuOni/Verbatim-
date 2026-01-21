import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("AI service not configured");
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const targetLanguage = formData.get('targetLanguage') as string || null;

    if (!file) {
      console.error("No file provided in request");
      return new Response(
        JSON.stringify({ error: "No file provided" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Processing file: ${file.name}, size: ${file.size} bytes, type: ${file.type}`);

    // Convert file to base64 for Gemini API
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let binaryString = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binaryString += String.fromCharCode(uint8Array[i]);
    }
    const base64Data = btoa(binaryString);

    // Determine MIME type
    const mimeType = file.type || 'audio/mpeg';

    console.log(`File converted to base64, MIME type: ${mimeType}`);

    // Create transcription prompt
    let systemPrompt = `You are an expert transcription assistant. Transcribe the audio/video content accurately.
    
Rules:
- Transcribe all spoken words exactly as heard
- Include speaker identification if multiple speakers (e.g., "Speaker 1:", "Speaker 2:")
- Include timestamps in [HH:MM:SS] format at natural breaks (every 30 seconds or at paragraph breaks)
- Preserve the original language of the content
- Note any significant non-speech sounds in [brackets] like [music], [applause], [laughter]
- If parts are unclear, mark them as [inaudible]
- Format the output as clean, readable paragraphs`;

    if (targetLanguage) {
      systemPrompt += `\n\nAfter the transcription, also provide a translation to ${targetLanguage}.
Format the output as:
--- ORIGINAL TRANSCRIPTION ---
[original content]

--- TRANSLATION (${targetLanguage}) ---
[translated content]`;
    }

    console.log("Sending request to Lovable AI Gateway...");

    // Call Lovable AI Gateway with multimodal content
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Please transcribe the following audio/video content:"
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Data}`
                }
              }
            ]
          }
        ],
        max_tokens: 16000,
        temperature: 0.1
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AI Gateway error: ${response.status} - ${errorText}`);
      throw new Error(`AI processing failed: ${response.status}`);
    }

    const data = await response.json();
    const transcription = data.choices?.[0]?.message?.content;

    if (!transcription) {
      console.error("No transcription in response:", JSON.stringify(data));
      throw new Error("No transcription generated");
    }

    console.log(`Transcription completed, length: ${transcription.length} characters`);

    return new Response(
      JSON.stringify({ 
        success: true,
        transcription,
        fileName: file.name,
        fileSize: file.size,
        targetLanguage
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: unknown) {
    console.error("Transcription error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to process file";
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: String(error)
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});