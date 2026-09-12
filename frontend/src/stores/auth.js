import { reactive } from 'vue';
import { apiRequest } from '../services/api';

const STORAGE_KEY = 'groovegavel.session';

function readSession() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Number.isSafeInteger(value?.userId) && value.userId > 0 && value.token) return value;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
  return { userId: null, token: '' };
}

const saved = readSession();
const state = reactive({
  userId: saved.userId,
  token: saved.token,
  profile: null,
  welcomeInvitationPending: false
});

function persist() {
  if (state.userId && state.token) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ userId: state.userId, token: state.token }));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function setSession(session) {
  state.userId = session.user_id;
  state.token = session.session_token;
  state.profile = null;
  persist();
}

function clearSession() {
  state.userId = null;
  state.token = '';
  state.profile = null;
  state.welcomeInvitationPending = false;
  persist();
}

export const authStore = {
  state,
  get isAuthenticated() {
    return Boolean(state.userId && state.token);
  },
  async login(credentials) {
    const session = await apiRequest('/login', { method: 'POST', body: credentials });
    setSession(session);
    return session;
  },
  async register(details) {
    const { user_id } = await apiRequest('/users', { method: 'POST', body: details });
    await this.login({ email: details.email, password: details.password });
    return user_id;
  },
  requestWelcomeInvitation() {
    state.welcomeInvitationPending = true;
  },
  consumeWelcomeInvitation() {
    state.welcomeInvitationPending = false;
  },
  async loadProfile() {
    if (!state.userId) return null;
    try {
      state.profile = await apiRequest(`/users/${state.userId}`);
      return state.profile;
    } catch (error) {
      if (error.status === 401 || error.status === 404) clearSession();
      throw error;
    }
  },
  async logout() {
    try {
      if (state.token) await apiRequest('/logout', { method: 'POST', token: state.token });
    } finally {
      clearSession();
    }
  },
  clear: clearSession
};
