import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

    if (!OPENAI_API_KEY) {
      throw new Error("API ключ OpenAI не знайдено на сервері");
    }
    if (!imageBase64) {
      throw new Error("Фотографія не була передана");
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are an AI assistant that extracts data from construction work orders. Output ONLY a valid JSON object.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Extract data from this document. If a field is missing, return an empty string or null. JSON structure required: 
                { 
                  "type": "Return 'Address' for standard installs, or 'Service' if it's a repair/service ticket", 
                  "work_order_number": "Extract the Order Number or Job Number (e.g., CG600770, 47174-1)",
                  "builder_name": "Extract the builder/client name from 'Reference' or 'Sold To'. Ignore contact person names.", 
                  "store_name": "Identify the store issuing the ticket (usually 'THE FLOOR SHOW' or 'TOUCHSTONE CANADA LTD.')", 
                  "address": "Full job site address from 'Ship To' or 'Install At'", 
                  "date": "Extract the date. Format strictly as YYYY-MM-DD. Since current year is 2026, ensure the year is 2026.", 
                  "total_amount": "Total labor amount at the bottom (number only, no currency symbol)",
                  "ai_translation": "Extract any special instructions, 'NOTE', 'IMPORTANT NOTE', or descriptions of the work from the document. Translate them clearly into Ukrainian. Structure the text nicely.",
                  "work_types": [
                    {
                      "name": "Extract the exact text under 'PC Style/Item', 'Description', or 'Item' (e.g., 'LVP CLICK INSTALL', 'STAIRS', 'INSTALL STEPS')",
                      "amount": "Extract the total price or extended price for this specific line item (number only). If not found, return 0."
                    }
                  ]
                }`,
              },
              {
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(`OpenAI Error: ${data.error.message}`);
    }

    const parsedContent = JSON.parse(data.choices[0].message.content);
    return new Response(JSON.stringify(parsedContent), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
