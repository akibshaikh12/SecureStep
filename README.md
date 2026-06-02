# SecureStep 🛡️

SecureStep is an end-to-end emergency SOS and automated evidence collection platform. Built to balance transactional identity data with real-time incident tracking, the application captures instant ambient environment data (encrypted photo overlays and microphone audio loops) when an SOS is triggered, instantly alerting a user's verified contact network via Firebase Cloud Messaging (FCM).

---

## 🚀 System Architecture Overview

SecureStep splits processing tasks between a decoupled single-page application (SPA) client layer and an asynchronous operational backend service.

* **Frontend:** React (SPA) managed by Vite, styled with Tailwind CSS, leveraging Lucide React for iconography. It uses the Firebase Web SDK for Web Push capabilities and client-side EmailJS for localized verification loops.
* **Backend:** Node.js and Express.js REST API layer that interfaces with Neon PostgreSQL (via `pg`) for authentication boundaries and maintains localized JSON schemas for high-speed tracking data.
* **Data Storage Matrix:** 
  * **Neon Postgres (Transactional):** User accounts, cryptographic password signatures (`bcrypt`), and pending registration OTP data.
  * **Operational Store (`store.json`):** Dynamic emergency incident registries, contact network structures, asset indexes, and real-time journey telemetry logs.

---

## 🛠️ Repository File Structure

```text
├── backend/
│   ├── store.json           # Operational data ledger (Incidents/Evidence/Contacts)
│   ├── .env.example         # Example server environment file
│   └── package.json
└── frontend/
    ├── public/
    │   └── firebase-messaging-sw.js  # Background worker for incoming FCM push
    ├── .env.example         # Example client environment file
    └── package.json
