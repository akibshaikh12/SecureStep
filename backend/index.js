const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authController = require('./controllers/authController');
const contactController = require('./controllers/contactController');
const trustedGroupController = require('./controllers/trustedGroupController');
const { getStore } = require('./store/memoryStore');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

authController.seedDemoUser();
authController.seedDemoContactUser();
const demoUser = getStore().users.find((u) => u.email === authController.DEMO_EMAIL);
if (demoUser) {
  contactController.seedDemoContacts(demoUser.id);
  trustedGroupController.seedDemoGroups(demoUser.id);
}

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/contacts', require('./routes/contactRoutes'));
app.use('/api/incidents', require('./routes/incidentRoutes'));
app.use('/api/location', require('./routes/locationRoutes'));
app.use('/api/evidence', require('./routes/evidenceRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/trusted-groups', require('./routes/trustedGroupRoutes'));
app.use('/api/journeys', require('./routes/journeyRoutes'));
app.use('/api/privacy', require('./routes/privacyRoutes'));
app.use('/api/push', require('./routes/pushRoutes'));

const fcmService = require('./services/fcmService');

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    pushConfigured: fcmService.isConfigured(),
    demoAccount: { email: authController.DEMO_EMAIL, password: authController.DEMO_PASSWORD },
    demoContactAccount: {
      email: authController.DEMO_CONTACT_EMAIL,
      password: authController.DEMO_PASSWORD,
      note: 'Login on second device to receive SOS push from demo user',
    },
  });
});

app.get('/', (req, res) => {
  res.send('SecureStep API is running');
});

const server = app.listen(PORT, () => {
  console.log(`SecureStep API on http://localhost:${PORT}`);
  console.log(`Demo login: ${authController.DEMO_EMAIL} / ${authController.DEMO_PASSWORD}`);
});

server.on('error', (err) => console.error('Server error:', err));
server.on('close', () => console.log('Server closed!'));

// Keep event loop alive just in case
setInterval(() => {}, 60000);
