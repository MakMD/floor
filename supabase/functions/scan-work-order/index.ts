import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("=== СТАРТ СКАНУВАННЯ ДОКУМЕНТА ===");

    const { imageBase64, imagesBase64 } = await req.json();
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

    if (!OPENAI_API_KEY) {
      throw new Error("API ключ OpenAI не знайдено на сервері");
    }

    // Підтримуємо як одне фото, так і масив кількох фотографій
    let photosArray: string[] = [];
    if (imagesBase64 && Array.isArray(imagesBase64)) {
      photosArray = imagesBase64;
    } else if (imageBase64) {
      photosArray = [imageBase64];
    } else {
      throw new Error("Фотографії не були передані");
    }

    const imageContentParts = photosArray.map((b64: string) => {
      const cleanB64 = b64.replace(/^data:image\/\w+;base64,/, "");
      return {
        type: "image_url",
        image_url: {
          url: `data:image/jpeg;base64,${cleanB64}`,
          detail: "high",
        },
      };
    });

    console.log(
      `Відправляємо ${photosArray.length} зображень до OpenAI API (gpt-4o)...`,
    );

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
                  enum: ["Address", "Service"],
                  description:
                    "Strictly return 'Address' for standard installs, or 'Service' if it's a repair/service ticket. DO NOT RETURN 'object'.",
                },
                work_order_number: {
                  type: "string",
                  description: "Extract the Order Number or Job Number",
                },
                builder_name: {
                  type: "string",
                  description:
                    "Extract the builder/client name from 'Reference', 'Sold To', or 'Job:' section.",
                },
                store_name: {
                  type: "string",
                  description:
                    "Identify the store issuing the ticket, or empty string.",
                },
                address: {
                  type: "string",
                  description:
                    "Full job site address from 'Ship To' or 'Install At' or below Job number.",
                },
                date: {
                  type: "string",
                  description:
                    "Extract the date. Format strictly as YYYY-MM-DD. Return empty string if missing.",
                },
                total_amount: {
                  type: "number",
                  description:
                    "Total labor amount at the bottom of the document. Return 0 if missing.",
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
                          "Clean name of the work (e.g., 'Main Floor - Floor', 'LVP CLICK INSTALL')",
                      },
                      area: {
                        type: "string",
                        description:
                          "Specific zone if mentioned. Empty string if not.",
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
              "You are an OCR and data extraction specialist for construction work orders. Combine information from all provided sequential images of the same document into a single result. CRITICAL RULE FOR TRANSLATIONS: Whenever you translate text to Ukrainian (for 'line_notes' or 'ai_translation'), you MUST ALWAYS append the exact original English text in parentheses. Example output format: 'Весь головний поверх (WHOLE MAIN FLOOR)'.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze these sequential images of a work order / job tracker. Combine all items and data across all images into a single JSON response.

CRITICAL INSTRUCTIONS FOR EXTRACTION:
1. Identifying Items: Work items might start with "Customer Order Line Number:" OR they might just be listed with an arrow/bullet point (e.g., "> Main Floor - Floor"). Capture all distinct work areas/items.
2. Finding Notes: Look directly BENEATH the item description. Any text physically located below an item (like "Grout Type", "Directional Layout") MUST be captured into the 'line_notes' field of that item.
3. Project Type: MUST be strictly "Address" or "Service".
4. Translation & Formatting: Translate ALL 'line_notes' and 'ai_translation' notes into Ukrainian using THIS EXACT FORMAT: [Ukrainian Translation] ([ORIGINAL ENGLISH TEXT]).`,
              },
              ...imageContentParts,
            ],
          },
        ],
      }),
    });

    const data = await response.json();

    console.log("=== СИРА ВІДПОВІДЬ ШІ (RAW) ===");
    console.log(JSON.stringify(data, null, 2));

    if (data.error) {
      throw new Error(`OpenAI Error: ${data.error.message}`);
    }

    const parsedContent = JSON.parse(data.choices[0].message.content);

    console.log("=== РОЗПАРСЕНИЙ РЕЗУЛЬТАТ (ЩО ЙДЕ НА САЙТ) ===");
    console.log(JSON.stringify(parsedContent, null, 2));

    return new Response(JSON.stringify(parsedContent), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("=== ПОМИЛКА СКАНУВАННЯ ===");
    console.error("Деталі:", error.message || error);

    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
