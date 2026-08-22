import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const bodyText = await req.text();
    console.log("Received raw body:", bodyText);

    const { personId, address, date } = JSON.parse(bodyText);

    if (!personId || !address) {
      throw new Error(
        `Missing required fields: personId=${personId}, address=${address}`,
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: person, error: personError } = await supabase
      .from("people")
      .select("phone, name")
      .eq("id", personId)
      .single();

    if (personError || !person?.phone) {
      throw new Error(
        `Працівника з ID ${personId} не знайдено або у нього немає номера телефону.`,
      );
    }

    const workerPhone = person.phone;
    const workerName = person.name;

    const messageBody = `Привіт, ${workerName}!\nТебе призначено на новий об'єкт 🛠\n📍 Адреса: ${address}\n📅 Дата: ${date || "Не вказана"}\nЗайди у свій кабінет Flooring Boss для перегляду деталей.`;

    const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
    const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
    const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      throw new Error("Ключі Twilio не налаштовані на сервері.");
    }

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    const params = new URLSearchParams();

    params.append("To", workerPhone);
    params.append("From", TWILIO_PHONE_NUMBER);
    params.append("Body", messageBody);

    const twilioResponse = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
      },
      body: params.toString(),
    });

    const twilioResult = await twilioResponse.json();

    if (!twilioResponse.ok) {
      throw new Error(twilioResult.message || "Помилка відправки через Twilio");
    }

    return new Response(
      JSON.stringify({ success: true, messageId: twilioResult.sid }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Function error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
