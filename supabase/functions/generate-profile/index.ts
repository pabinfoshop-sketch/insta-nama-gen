import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProfileSuggestion {
  username: string;
  bio: string;
  imageUrl: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { keyword } = await req.json();

    if (!keyword) {
      return new Response(
        JSON.stringify({ error: "Keyword is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Generating profiles for keyword: ${keyword}`);

    // Generate usernames and bios
    const textResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "Você é um especialista em criar nomes de perfil criativos e biografias cativantes para Instagram. Seja criativo, moderno e relevante.",
          },
          {
            role: "user",
            content: `Gere 3 sugestões de perfis do Instagram baseados na palavra-chave: "${keyword}". Para cada perfil, retorne em JSON com o formato:
{
  "suggestions": [
    {
      "username": "nome_usuario_sem_@",
      "bio": "biografia curta e criativa (máximo 150 caracteres)"
    }
  ]
}
Os nomes de usuário devem ser únicos, criativos e relacionados à palavra-chave. As biografias devem ser atraentes e usar emojis quando apropriado.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_profiles",
              description: "Generate Instagram profile suggestions",
              parameters: {
                type: "object",
                properties: {
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        username: { type: "string" },
                        bio: { type: "string" },
                      },
                      required: ["username", "bio"],
                    },
                  },
                },
                required: ["suggestions"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_profiles" } },
      }),
    });

    if (!textResponse.ok) {
      if (textResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de taxa excedido. Tente novamente mais tarde." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (textResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos esgotados. Adicione fundos ao seu workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${textResponse.status}`);
    }

    const textData = await textResponse.json();
    console.log("Text generation response:", JSON.stringify(textData));

    const toolCall = textData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call found in response");
    }

    const profiles = JSON.parse(toolCall.function.arguments);
    console.log("Generated profiles:", JSON.stringify(profiles));

    // Generate profile images for each username
    const suggestions: ProfileSuggestion[] = [];

    for (const profile of profiles.suggestions) {
      try {
        console.log(`Generating image for username: ${profile.username}`);
        
        const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-image",
            messages: [
              {
                role: "user",
                content: `Create a professional, modern Instagram profile picture that represents the theme: "${keyword}". Style: clean, vibrant, and suitable for social media. Square format.`,
              },
            ],
            modalities: ["image"],
          }),
        });

        if (!imageResponse.ok) {
          console.error(`Image generation failed for ${profile.username}: ${imageResponse.status}`);
          // Use a placeholder if image generation fails
          suggestions.push({
            ...profile,
            imageUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`,
          });
          continue;
        }

        const imageData = await imageResponse.json();
        const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (imageUrl) {
          suggestions.push({
            ...profile,
            imageUrl,
          });
        } else {
          // Fallback to placeholder
          suggestions.push({
            ...profile,
            imageUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`,
          });
        }
      } catch (imgError) {
        console.error(`Error generating image for ${profile.username}:`, imgError);
        // Use placeholder on error
        suggestions.push({
          ...profile,
          imageUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`,
        });
      }
    }

    console.log(`Successfully generated ${suggestions.length} profiles`);

    return new Response(
      JSON.stringify({ suggestions }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-profile function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
