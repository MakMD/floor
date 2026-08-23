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
        temperature: 0.1, // Жорстка точність, щоб уникнути фантазій ШІ
        messages: [
          {
            role: "system",
            content:
              "You are an expert AI assistant specialized in extracting highly accurate data from construction and flooring work orders. You meticulously analyze tables and never drop line notes. Output ONLY a valid JSON object matching the exact requested schema.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze the provided work order image carefully. Extract all requested fields. Pay special attention to the line items table.

                CRITICAL INSTRUCTIONS FOR TABLE READING & NOTES:
                1. The table contains distinct "blocks" or rows of work. A primary row (e.g., LVP, CARPET, LABOR) is often followed immediately by sub-rows containing critical notes for that specific item (e.g., "Order Line Notes:", "INSTALL AREAS:").
                2. You MUST attach these sub-row notes to their corresponding primary row in the 'line_notes' field. Do NOT ignore them.
                3. Do NOT merge different primary rows together. Treat each main material/labor line as a separate object in the 'work_types' array.
                4. Numeric columns are ordered as: Quantity/SqFt, Unit Price/Rate, Extended Price/Total.
                5. Translate all 'line_notes' and the 'ai_translation' (general instructions) into Ukrainian.

                JSON Structure required:
                { 
                  "type": "Return 'Address' for standard installs, or 'Service' if it's a repair/service ticket", 
                  "work_order_number": "Extract the Order Number or Job Number",
                  "builder_name": "Extract the builder/client name from 'Reference' or 'Sold To'.", 
                  "store_name": "Identify the store issuing the ticket", 
                  "address": "Full job site address from 'Ship To' or 'Install At'", 
                  "date": "Extract the date. Format strictly as YYYY-MM-DD. Ensure year is 2026.", 
                  "total_amount": "Total labor amount at the bottom of the document (number only)",
                  "ai_translation": "Extract ONLY GENERAL notes, warnings, or instructions found at the very bottom or top of the page (e.g., office contacts, general silicone warnings). Translate to Ukrainian. DO NOT put specific line item notes here.",
                  "work_types": [
                    {
                      "name": "Clean name of the work (e.g., 'Carpet Install', 'LVP Click', 'LVP Locking Labor')",
                      "area": "Specific zone (e.g., 'Basement', 'Main Floor'). If not specified, leave empty string.",
                      "sq_ft": "Quantity / SqFt (number only). Return 0 if missing.",
                      "rate": "Unit Price / Rate (number only). Return 0 if missing.",
                      "amount": "Total/Extended Price for this line (number only). Return 0 if missing.",
                      "line_notes": "Extract any specific 'Order Line Notes', 'Install Areas', or details directly underneath this specific item in its block. Translate these notes to Ukrainian. If none, leave empty string."
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

    // Додано безпечний парсинг JSON
    let parsedContent;
    try {
      parsedContent = JSON.parse(data.choices[0].message.content);
    } catch (parseError) {
      throw new Error("Не вдалося розпарсити відповідь від OpenAI як JSON");
    }

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
