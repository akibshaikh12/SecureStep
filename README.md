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
```


##⚙️ Environment Configuration
To run SecureStep locally or in production, you must configure target .env files in their respective roots.

1. Backend Configuration (backend/.env)

PORT=5000
DATABASE_URL=postgresql://<user>:<password>@<neon-host>/securestep?sslmode=require
JWT_SECRET=your_super_secret_jwt_key
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBg...\n-----END PRIVATE KEY-----"


2. Frontend Configuration (frontend/.env)

VITE_API_BASE_URL=http://localhost:5000
VITE_FIREBASE_API_KEY=AIzaSyA1...
VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-app
VITE_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234:web:abcd
VITE_FIREBASE_VAPID_KEY=BPD...your_public_vapid_key...
VITE_EMAILJS_SERVICE_ID=service_xxx
VITE_EMAILJS_TEMPLATE_ID=template_xxx
VITE_EMAILJS_PUBLIC_KEY=user_xxx


Step 2: Initialize Database Architecture

cd backend
npm install
npm run db:migrate


Step 3: Run the Application Services

Terminal 1 (Backend Server Instance):
cd backend
npm start

Terminal 2 (Frontend Client Instance):
cd frontend
npm install
npm run dev
