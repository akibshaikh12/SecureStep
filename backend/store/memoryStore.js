const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '../data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

const defaultStore = () => ({
  users: [],
  contacts: [],
  incidents: [],
  locations: [],
  evidence: [],
  chatSessions: [],
  pendingRegistrations: [],
  trustedGroups: [],
  journeys: [],
});

let store = defaultStore();

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function load() {
  ensureDataDir();
  if (!fs.existsSync(DATA_FILE)) {
    store = defaultStore();
    save();
    return;
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    store = { ...defaultStore(), ...JSON.parse(raw) };
  } catch {
    store = defaultStore();
    save();
  }
}

function save() {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf8');
}

function id() {
  return crypto.randomUUID();
}

function getStore() {
  return store;
}

function resetStore() {
  store = defaultStore();
  save();
}

load();

module.exports = { load, save, id, getStore, resetStore, defaultStore };
