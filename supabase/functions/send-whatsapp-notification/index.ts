import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  // Обробка CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const payload = await req.json();
    if (!payload.personId) {
      throw new Error("Missing personId.");
    }

    // Перший лог, який ми очікуємо побачити
    console.log(`[DEBUG] Function started for personId: ${payload.personId}`);

    // НАВМИСНО ГЕНЕРУЄМО ПОМИЛКУ
    // Ми кидаємо помилку, щоб перевірити, чи з'явиться вона в логах на дашборді Supabase.
    // Якщо ви побачите цю помилку в логах, це означатиме, що функція виконується,
    // але з якоїсь причини стандартний `console.log` не відображається.
    throw new Error("This is a test error to check if logging is working.");

    // Код нижче не буде виконано, він тут лише для повноти
    /*
    return new Response(JSON.stringify({ message: "This will not be reached" }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      status: 200,
    });
    */
  } catch (error) {
    // Важливо: ми також логуємо помилку на сервері перед тим, як відправити її клієнту.
    console.error(`[ERROR] An error occurred: ${error.message}`);

    return new Response(JSON.stringify({ error: error.message }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      status: 500, // Повертаємо статус 500, щоб чітко бачити помилку на клієнті
    });
  }
});
