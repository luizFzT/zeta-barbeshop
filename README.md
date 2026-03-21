# Zeta Barbershop SaaS

<p align="center">
  <img src="public/logo-new-hero.jpg" alt="Zeta Barbershop Neon Logo" width="250" height="250" style="border-radius: 50%; box-shadow: 0 10px 30px rgba(168, 85, 247, 0.4);" />
</p>

Zeta Barbershop is a modern, real-time Queue Management System built as a SaaS platform specifically designed for autonomous barbers. It completely replaces outdated booking systems by offering a dynamic, zero-friction smart queue.

The system calculates estimated wait times based on the complex physical reality of barbershops (services selected, strategic buffers), allowing clients to wait wherever they want while tracking their position on their phone.

## 🚀 Features

### For the Barber (Dashboard)
- **Real-Time Queue:** Add, remove, or call the next client in the queue with instantaneous optimistic UI updates and Supabase Realtime synchronization.
- **Smart Analytics:** Automatically tracks total clients served and average service times to provide powerful business insights.
- **Dynamic Services:** Configure specific services (e.g., Fade, Beard, Eyebrows) with accurate durations, which the system uses to crunch live wait-time estimates.
- **Barber Profile & Referral System:** Upload a professional identity and share the app easily with other barbers using the native Web Share API.
- **QR Code Generator:** Built-in QR Code generation for the Barbershop storefront, ready to print and display on the counter.

### For the Client (Queue App)
- **High-Fidelity Proportional Timer:** An elegant, gamified countdown dashboard. The "Tempo Estimado" ring is a mathematical progress bar that shrinks in physical length as the wait time decreases.
- **Live Tracking & Notifications:** Real-time updates on queue position, plus PWA Push Notifications to alert you when it's your turn.
- **Zero Friction:** No app store installation required. Clients scan a QR code and join directly via the WebApp, with a localized PWA install prompt.
- **Smart Confirmation Flow:** System automatically asks for presence confirmation when the wait time goes below 15 minutes, with a tolerance timer to avoid line-skipping abuse.

## 🎨 Design System

We employ a premium, cyberpunk-inspired **Dark Mode Glassmorphism** aesthetic.
- **Deep Navy/Black backgrounds:** (`#0a061e` to `#09090B`)
- **Single Accent Identity:** Exclusively using Neon Purple (`#a855f7`) to create a focused, professional high-end brand feel.
- **Frosted Glass:** Translucent cards with subtle glow borders and optimized spacing metrics.
- **No Emojis:** We enforce a strict professional look using Material Symbols instead of standard emojis.

## 🛠 Tech Stack

- **Frontend:** React 19, Vite, React Router DOM
- **Backend & Database:** Supabase (PostgreSQL, Auth)
- **Realtime:** Supabase Realtime Subscriptions
- **Styling:** Standard CSS with custom design variables (No heavy frameworks for maximum speed).
- **PWA:** Native Service Workers for notifications and offline install prompts.

## 💻 Getting Started (Local Development)

The project connects to Supabase, but also features a fallback **Demo Mode** leveraging `localStorage` for quick aesthetic testing without a backend connection.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/luizFzT/zeta-barbeshop.git
   cd zeta-barbeshop
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Environment Variables:**
   Create a `.env` file referencing your Supabase project keys (see documentation for required variables).

4. **Start the development server:**
   ```bash
   npm run dev
   ```

## 📄 Documentation & Roadmap

- **Architecture & UX Flows:** Check the [ZETA_BARBERSHOP_DOCS.md](ZETA_BARBERSHOP_DOCS.md) inside the repository.
- **Supabase Migration Plan:** We have mapped out a robust single-source-of-truth refactor in [SUPABASE_MIGRATION_PLAN.md](SUPABASE_MIGRATION_PLAN.md).
- **Future Roadmap:** See [ZETA_FUTURE_ROADMAP.md](ZETA_FUTURE_ROADMAP.md) for upcoming features like Stripe integration and advanced loyalty metrics.

---

*Transforming queues from a pain point into a premium experience.*
