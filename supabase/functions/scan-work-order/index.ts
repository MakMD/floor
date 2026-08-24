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

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        temperature: 0.1,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "work_order_schema",
            strict: true,
            schema: {
              type: "object",
              properties: {
                type: {
                  type: "string",
                  description:
                    "Return 'Address' for standard installs, or 'Service' if it's a repair/service ticket",
                },
                work_order_number: {
                  type: "string",
                  description: "Extract the Order Number or Job Number",
                },
                builder_name: {
                  type: "string",
                  description:
                    "Extract the builder/client name from 'Reference' or 'Sold To'.",
                },
                store_name: {
                  type: "string",
                  description: "Identify the store issuing the ticket",
                },
                address: {
                  type: "string",
                  description:
                    "Full job site address from 'Ship To' or 'Install At'",
                },
                date: {
                  type: "string",
                  description:
                    "Extract the date. Format strictly as YYYY-MM-DD. Ensure year is 2026.",
                },
                total_amount: {
                  type: "number",
                  description:
                    "Total labor amount at the bottom of the document",
                },
                ai_translation: {
                  type: "string",
                  description:
                    "Translate ONLY GENERAL notes into Ukrainian. STRICT FORMAT: 'Ukrainian translation (ORIGINAL ENGLISH TEXT)'. Do not put line-item specific notes here.",
                },
                work_types: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: {
                        type: "string",
                        description:
                          "Clean name of the work (e.g., 'LVP CLICK INSTALL')",
                      },
                      area: {
                        type: "string",
                        description:
                          "Specific zone if mentioned on the same line. Empty string if not.",
                      },
                      sq_ft: {
                        type: "number",
                        description: "Quantity / SqFt. 0 if missing.",
                      },
                      rate: {
                        type: "number",
                        description: "Unit Price / Rate. 0 if missing.",
                      },
                      amount: {
                        type: "number",
                        description:
                          "Total/Extended Price for this line. 0 if missing.",
                      },
                      line_notes: {
                        type: "string",
                        description:
                          "Translate text found directly under this item into Ukrainian. STRICT FORMAT: 'Ukrainian translation (ORIGINAL ENGLISH TEXT)'. Empty string if none.",
                      },
                    },
                    required: [
                      "name",
                      "area",
                      "sq_ft",
                      "rate",
                      "amount",
                      "line_notes",
                    ],
                    additionalProperties: false,
                  },
                },
              },
              required: [
                "type",
                "work_order_number",
                "builder_name",
                "store_name",
                "address",
                "date",
                "total_amount",
                "ai_translation",
                "work_types",
              ],
              additionalProperties: false,
            },
          },
        },
        messages: [
          {
            role: "system",
            content:
              "You are an OCR and data extraction specialist for construction work orders. You extract data exactly as seen. CRITICAL RULE FOR TRANSLATIONS: Whenever you translate text to Ukrainian (for 'line_notes' or 'ai_translation'), you MUST ALWAYS append the exact original English text in parentheses. Example output format: 'Весь головний поверх (WHOLE MAIN FLOOR)'. Never output only Ukrainian.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this work order and extract the data according to the schema. 
                
                CRITICAL INSTRUCTIONS FOR 'line_notes' EXTRACTION:
                1. Identifying Items: Every new work item starts with the text "Customer Order Line Number:".
                2. Finding Notes: Look directly BENEATH the item description.
                3. The Problem: Line notes DO NOT have numbers in the Quantity/Rate/Labor columns.
                4. The Rule: Any text physically located between one "Customer Order Line Number" and the next one (or the final subtotal line), which lacks its own price/quantity, MUST be captured and concatenated into the 'line_notes' field of the item immediately above it.
                5. Translation & Formatting: Translate ALL 'line_notes' and 'ai_translation' notes into Ukrainian. YOU MUST USE THIS EXACT FORMAT: [Ukrainian Translation] ([ORIGINAL ENGLISH TEXT]). If you fail to include the English text in parentheses, the system will break.`,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${cleanBase64}`,
                  detail: "high",
                },
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
    console.error("Work Order Extraction Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
