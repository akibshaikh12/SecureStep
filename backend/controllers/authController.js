const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { getStore, save, id } = require('../store/memoryStore');
const { signToken } = require('../middleware/auth');

const DEMO_EMAIL = 'demo@securestep.app';
const DEMO_PASSWORD = 'demo1234';
const DEMO_CONTACT_EMAIL = 'contact.demo@securestep.app';

const OTP_EXPIRY_MS = 10 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;

function sanitizeUser(user) {
  const { passwordHash, twoFactorSecret, pending2FACode, ...safe } = user;
  return safe;
}

function findUserByEmail(email) {
  return getStore().users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

function generateOtp() {
  return String(crypto.randomInt(100000, 999999));
}

function hashOtp(otp) {
  return crypto.createHash('sha256').update(String(otp)).digest('hex');
}

exports.seedDemoUser = () => {
  const store = getStore();
  if (!findUserByEmail(DEMO_EMAIL)) {
    const passwordHash = bcrypt.hashSync(DEMO_PASSWORD, 10);
    store.users.push({
      id: id(),
      name: 'Demo User',
      email: DEMO_EMAIL,
      phone: '+1 (555) 010-0000',
      passwordHash,
      twoFactorEnabled: false,
      emailVerified: true,
      pushTokens: [],
      createdAt: new Date().toISOString(),
    });
    save();
  }
};

exports.seedDemoContactUser = () => {
  const store = getStore();
  if (findUserByEmail(DEMO_CONTACT_EMAIL)) return;
  const passwordHash = bcrypt.hashSync(DEMO_PASSWORD, 10);
  store.users.push({
    id: id(),
    name: 'Alex Morgan',
    email: DEMO_CONTACT_EMAIL,
    phone: '+1 (555) 010-2234',
    passwordHash,
    twoFactorEnabled: false,
    emailVerified: true,
    pushTokens: [],
    createdAt: new Date().toISOString(),
  });
  save();
};

exports.DEMO_CONTACT_EMAIL = DEMO_CONTACT_EMAIL;

/** Step 1: validate signup data, issue OTP (sent via EmailJS on the client). */
exports.requestRegistrationOtp = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (findUserByEmail(normalizedEmail)) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const store = getStore();
    if (!store.pendingRegistrations) store.pendingRegistrations = [];

    const existing = store.pendingRegistrations.find((p) => p.email === normalizedEmail);
    if (existing?.lastSentAt && Date.now() - existing.lastSentAt < OTP_RESEND_COOLDOWN_MS) {
      const waitSec = Math.ceil(
        (OTP_RESEND_COOLDOWN_MS - (Date.now() - existing.lastSentAt)) / 1000
      );
      return res.status(429).json({ message: `Please wait ${waitSec}s before resending OTP` });
    }

    const otp = generateOtp();
    const passwordHash = await bcrypt.hash(password, 10);
    const pending = {
      email: normalizedEmail,
      name: name.trim(),
      passwordHash,
      otpHash: hashOtp(otp),
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MS).toISOString(),
      lastSentAt: Date.now(),
      attempts: 0,
    };

    store.pendingRegistrations = store.pendingRegistrations.filter(
      (p) => p.email !== normalizedEmail
    );
    store.pendingRegistrations.push(pending);
    save();

    res.json({
      message: 'OTP generated. Send it to the user via EmailJS.',
      email: normalizedEmail,
      otp,
      expiresInSeconds: OTP_EXPIRY_MS / 1000,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Could not send OTP' });
  }
};

/** Step 2: verify OTP and create account. */
exports.verifyRegistrationOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email?.trim() || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }
    const normalizedEmail = email.trim().toLowerCase();
    const store = getStore();
    const pending = store.pendingRegistrations?.find((p) => p.email === normalizedEmail);

    if (!pending) {
      return res.status(400).json({ message: 'No pending registration. Request a new OTP.' });
    }
    if (new Date(pending.expiresAt) < new Date()) {
      store.pendingRegistrations = store.pendingRegistrations.filter(
        (p) => p.email !== normalizedEmail
      );
      save();
      return res.status(400).json({ message: 'OTP expired. Request a new code.' });
    }

    pending.attempts = (pending.attempts || 0) + 1;
    if (pending.attempts > 5) {
      store.pendingRegistrations = store.pendingRegistrations.filter(
        (p) => p.email !== normalizedEmail
      );
      save();
      return res.status(429).json({ message: 'Too many attempts. Request a new OTP.' });
    }

    if (hashOtp(String(otp).trim()) !== pending.otpHash) {
      save();
      return res.status(401).json({ message: 'Invalid verification code' });
    }

    if (findUserByEmail(normalizedEmail)) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const user = {
      id: id(),
      name: pending.name,
      email: normalizedEmail,
      phone: '',
      passwordHash: pending.passwordHash,
      twoFactorEnabled: false,
      emailVerified: true,
      createdAt: new Date().toISOString(),
    };
    store.users.push(user);
    store.pendingRegistrations = store.pendingRegistrations.filter(
      (p) => p.email !== normalizedEmail
    );
    save();

    const token = signToken({ userId: user.id, email: user.email });
    res.status(201).json({ token, user: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Verification failed' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email?.trim() || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const user = findUserByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const token = signToken({ userId: user.id, email: user.email });
    res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Login failed' });
  }
};

exports.me = (req, res) => {
  const user = getStore().users.find((u) => u.id === req.user.userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.json({ user: sanitizeUser(user) });
};

exports.DEMO_EMAIL = DEMO_EMAIL;
exports.DEMO_PASSWORD = DEMO_PASSWORD;
