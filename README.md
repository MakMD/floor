# Flooring Boss - B2B SaaS Construction Management

## 🚀 Project Overview
A comprehensive B2B SaaS platform designed to automate dispatching, order processing, and communication for construction businesses. This solution eliminates manual data entry and streamlines workflows through AI integrations and serverless architecture.

## 🏗️ Key Features
* **AI-Powered Order Parsing:** Integrates GPT-4o Vision to automatically extract and parse complex PDF work orders into strict JSON schemas.
* **Automated SMS Notifications:** Utilizes Supabase Edge Functions and the Twilio API to trigger real-time job assignments to workers.
* **Secure Access Control:** Implements strict PostgreSQL Row Level Security (RLS) to ensure robust data isolation between administrators and field workers.
* **Dynamic Document Generation:** Automated PDF creation for reporting and seamless invoicing.

## 💻 Tech Stack
* **Frontend:** React, JavaScript, Vite
* **Backend & Database:** Supabase (PostgreSQL, Edge Functions, Storage)
* **Integrations:** OpenAI API (Vision), Twilio API

## 🔒 Architecture & Security
Engineered with a strong emphasis on data security. The architecture leverages strict Row Level Security (RLS) policies to protect sensitive client operational data, ensuring scalable and secure B2B deployments.
