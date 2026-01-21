import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Emotion-to-voice-style mapping for the AI
const emotionPrompts: Record<string, string> = {
  neutral: "Speak in a calm, professional, and neutral tone. Clear and straightforward delivery.",
  happy: "Speak with warmth, enthusiasm, and joy. Let a smile come through in the voice. Upbeat and positive energy.",
  sad: "Speak with a softer, more subdued tone. Convey empathy and gentle melancholy. Slower pacing.",
  excited: "Speak with high energy and enthusiasm! Dynamic pacing, emphasizing key words with passion and excitement.",
  serious: "Speak with gravitas and authority. Measured, deliberate pacing. Professional and formal tone.",
  friendly: "Speak in a warm, approachable, conversational manner. Like talking to a good friend.",
  dramatic: "Speak with theatrical flair and emotional intensity. Varied pacing and emphasis for maximum impact.",
  calm: "Speak in a soothing, peaceful manner. Slow, measured pacing. Perfect for meditation or relaxation content.",
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

    const { text, emotion = 'neutral', language = 'English' } = await req.json();

    if (!text || text.trim().length === 0) {
      console.error("No text provided for voiceover");
      return new Response(
        JSON.stringify({ error: "No text provided" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Generating voiceover: emotion=${emotion}, language=${language}, text length=${text.length}`);

    const emotionInstruction = emotionPrompts[emotion] || emotionPrompts.neutral;

    // Create a detailed script with emotional direction
    const systemPrompt = `You are an expert voice director and script adapter. Your task is to prepare text for voice-over recording by adding emotional cues, pacing notes, and emphasis markers.

Emotion Style: ${emotion.toUpperCase()}
Voice Direction: ${emotionInstruction}
Target Language: ${language}

Transform the provided text into a professional voice-over script with:
1. [PAUSE] markers for natural breathing points
2. *emphasis* on key words
3. (emotional cues) in parentheses where tone should shift
4. // pacing notes // for speed changes
5. Phonetic guides for difficult words if needed

Make the script feel natural and emotionally authentic for the ${emotion} style.`;

    console.log("Sending request to Lovable AI Gateway...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: `Please prepare this text for ${emotion} voice-over in ${language}:\n\n${text}`
          }
        ],
        max_tokens: 8000,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AI Gateway error: ${response.status} - ${errorText}`);
      throw new Error(`AI processing failed: ${response.status}`);
    }

    const data = await response.json();
    const voiceoverScript = data.choices?.[0]?.message?.content;

    if (!voiceoverScript) {
      console.error("No voiceover script in response:", JSON.stringify(data));
      throw new Error("No voiceover script generated");
    }

    console.log(`Voiceover script generated, length: ${voiceoverScript.length} characters`);

    return new Response(
      JSON.stringify({ 
        success: true,
        originalText: text,
        voiceoverScript,
        emotion,
        language,
        emotionDescription: emotionInstruction
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: unknown) {
    console.error("Voiceover generation error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate voiceover";
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