// createWorkerAccounts.js
import "dotenv/config"; // Автоматично читає файл .env
import { createClient } from "@supabase/supabase-js";

// Беремо змінні прямо з .env файлу
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "❌ ПОМИЛКА: Не знайдено SUPABASE_URL або SUPABASE_SERVICE_ROLE_KEY у файлі .env",
  );
  process.exit(1);
}

// Використовуємо Service Role Key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

function cleanPhoneNumber(phone) {
  if (!phone) return null;
  // Видаляємо всі нецифрові символи (плюси, дужки, пробіли, дефіси)
  return phone.replace(/\D/g, "");
}

async function createAccounts() {
  console.log("Starting account creation process...");

  // 1. Отримуємо всіх людей, у яких є номер телефону
  const { data: people, error: fetchError } = await supabase
    .from("people")
    .select("id, name, phone, user_id")
    .not("phone", "is", null);

  if (fetchError) {
    console.error("Error fetching people:", fetchError);
    return;
  }

  console.log(`Found ${people.length} people with phone numbers.`);

  let successCount = 0;
  let errorCount = 0;

  for (const person of people) {
    const rawPhone = person.phone;
    const cleanPhone = cleanPhoneNumber(rawPhone);

    if (!cleanPhone || cleanPhone.length < 4) {
      console.log(
        `Skipping ${person.name}: Invalid phone number (${rawPhone})`,
      );
      continue;
    }

    // Якщо в таблиці вже є прив'язаний user_id, пропускаємо
    if (person.user_id) {
      console.log(
        `Skipping ${person.name}: Account already exists (user_id is present)`,
      );
      continue;
    }

    // Формуємо логін
    const loginEmail = `${cleanPhone}@flooringboss.app`;

    // Формуємо пароль: Прізвище (або останнє слово з імені) + останні 4 цифри номера
    const nameParts = person.name.trim().split(" ");
    const lastName = nameParts[nameParts.length - 1].toUpperCase();
    const last4Digits = cleanPhone.slice(-4);
    const password = `${lastName}${last4Digits}`;

    console.log(
      `Creating account for ${person.name} | Login: ${cleanPhone} | Pass: ${password}`,
    );

    try {
      // 2. Створюємо користувача в Supabase Auth
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email: loginEmail,
          password: password,
          email_confirm: true,
          user_metadata: {
            first_name: nameParts[0],
            last_name: lastName,
            full_name: person.name,
            person_id: person.id,
          },
        });

      if (authError) {
        console.error(
          `❌ Failed to create auth for ${person.name}:`,
          authError.message,
        );
        errorCount++;
        continue;
      }

      // 3. Оновлюємо запис у таблиці 'people', додаючи ID створеного акаунта
      const { error: updateError } = await supabase
        .from("people")
        .update({ user_id: authData.user.id })
        .eq("id", person.id);

      if (updateError) {
        console.error(
          `❌ Failed to link user_id to people table for ${person.name}:`,
          updateError.message,
        );
        errorCount++;
      } else {
        console.log(`✅ Success: ${person.name}`);
        successCount++;
      }
    } catch (err) {
      console.error(`❌ Unexpected error for ${person.name}:`, err);
      errorCount++;
    }
  }

  console.log("--- Process Completed ---");
  console.log(`Successfully created: ${successCount}`);
  console.log(`Errors encountered: ${errorCount}`);
}

createAccounts();
