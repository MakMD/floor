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
        temperature: 0.1, // Жорстка точність
        messages: [
          {
            role: "system",
            content:
              "You are an expert AI assistant specialized in extracting highly accurate data from construction and flooring work orders. Output ONLY a valid JSON object matching the exact requested schema.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze the provided work order image carefully. Extract all requested fields. Pay special attention to the line items table.

                HINT FOR TABLE READING: Read horizontally. If a description combines area and material (e.g., 'BASEMENT + LANDING - CARPET'), split them into 'area' ("BASEMENT + LANDING") and 'name' ("CARPET"). 
                The numeric columns are usually ordered as: 1. Quantity/SqFt (e.g. 308.89), 2. Unit Price/Rate (e.g. 1.50), 3. Extended Price/Total (e.g. 463.33).

                JSON Structure required:
                { 
                  "type": "Return 'Address' for standard installs, or 'Service' if it's a repair/service ticket", 
                  "work_order_number": "Extract the Order Number or Job Number",
                  "builder_name": "Extract the builder/client name from 'Reference' or 'Sold To'.", 
                  "store_name": "Identify the store issuing the ticket", 
                  "address": "Full job site address from 'Ship To' or 'Install At'", 
                  "date": "Extract the date. Format strictly as YYYY-MM-DD. Ensure year is 2026.", 
                  "total_amount": "Total labor amount at the bottom of the document (number only)",
                  "ai_translation": "Extract ANY general notes, warnings, or instructions found on the page (like door codes, layout notes). Translate to Ukrainian. DO NOT include line item details here.",
                  "work_types": [
                    {
                      "name": "Clean name of the work (e.g., 'Carpet Install', 'LVP Click', 'Flush Vents')",
                      "area": "Specific zone (e.g., 'Basement', 'Main Floor', 'Stairs'). If not specified, leave empty string.",
                      "sq_ft": "Quantity / SqFt (number only). Return 0 if missing.",
                      "rate": "Unit Price / Rate (number only). Return 0 if missing.",
                      "amount": "Total/Extended Price for this line (number only). Return 0 if missing."
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
