// ============================================================
// LogoKu — admin auth controller (login.html)
// Uses the browser Supabase client (anon key only; RLS enforces access).
// Security notes:
//   - Passwords are never logged or persisted by this module.
//   - Raw Supabase errors are mapped to friendly Indonesian messages so
//     internal details (user existence, provider state) do not leak.
//   - Submit is disabled while a request is in flight to avoid races.
// ============================================================
import { supabase } from './lib/supabaseClient.js';

const DASHBOARD_URL = 'dashboard.html';
const MIN_PASSWORD_LENGTH = 8;

// ---------- DOM refs ----------
const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');
const heading = document.getElementById('auth-heading');
const subheading = document.getElementById('auth-subheading');
const form = document.getElementById('auth-form');
const fieldFullname = document.getElementById('field-fullname');
const inputFullname = document.getElementById('auth-fullname');
const inputEmail = document.getElementById('auth-email');
const inputPassword = document.getElementById('auth-password');
const passwordHint = document.getElementById('password-hint');
const loginExtras = document.getElementById('field-login-extras');
const rememberCheckbox = document.getElementById('auth-remember');
const forgotBtn = document.getElementById('forgot-password');
const submitBtn = document.getElementById('auth-submit');
const switchPrompt = document.getElementById('auth-switch-prompt');
const switchAction = document.getElementById('auth-switch-action');
const statusRegion = document.getElementById('auth-status');

let mode = 'login'; // 'login' | 'register'
let inFlight = false;

// ---------- status helpers ----------
function clearStatus() {
  statusRegion.textContent = '';
  statusRegion.className = 'auth-status';
}
function showError(message) {
  statusRegion.textContent = message;
  statusRegion.className = 'auth-status error-text';
}
function showOk(message) {
  statusRegion.textContent = message;
  statusRegion.className = 'auth-status ok-text';
}

/**
 * Map a Supabase auth error to a friendly Indonesian message.
 * We deliberately avoid surfacing raw error text to the user.
 */
function friendlyAuthError(error) {
  const raw = (error && (error.message || error.error_description || '')) || '';
  const msg = raw.toLowerCase();
  if (msg.includes('invalid login') || msg.includes('invalid credentials')) {
    return 'Email atau kata sandi salah.';
  }
  if (msg.includes('email not confirmed')) {
    return 'Email belum dikonfirmasi. Periksa kotak masuk Anda.';
  }
  if (msg.includes('already registered') || msg.includes('already been registered') || msg.includes('user already')) {
    return 'Email ini sudah terdaftar. Silakan masuk.';
  }
  if (msg.includes('rate limit') || msg.includes('too many')) {
    return 'Terlalu banyak percobaan. Coba lagi beberapa saat.';
  }
  if (msg.includes('password')) {
    return 'Kata sandi tidak memenuhi syarat (minimal 8 karakter).';
  }
  if (msg.includes('network') || msg.includes('fetch')) {
    return 'Gagal terhubung ke server. Periksa koneksi Anda.';
  }
  return 'Terjadi kesalahan. Silakan coba lagi.';
}

// ---------- in-flight / disabled state ----------
function setInFlight(active, busyLabel) {
  inFlight = active;
  submitBtn.disabled = active;
  submitBtn.setAttribute('aria-busy', active ? 'true' : 'false');
  if (active) {
    submitBtn.dataset.label = submitBtn.textContent;
    submitBtn.textContent = busyLabel || 'Memproses…';
  } else if (submitBtn.dataset.label) {
    submitBtn.textContent = submitBtn.dataset.label;
    delete submitBtn.dataset.label;
  }
}

function disableForms(message) {
  [inputFullname, inputEmail, inputPassword, rememberCheckbox, submitBtn, forgotBtn, tabLogin, tabRegister]
    .forEach((el) => { if (el) el.disabled = true; });
  showError(message);
}

// ---------- tab switching ----------
function setMode(next) {
  mode = next;
  const isLogin = mode === 'login';

  tabLogin.classList.toggle('is-active', isLogin);
  tabRegister.classList.toggle('is-active', !isLogin);
  tabLogin.setAttribute('aria-selected', String(isLogin));
  tabRegister.setAttribute('aria-selected', String(!isLogin));
  form.setAttribute('aria-labelledby', isLogin ? 'tab-login' : 'tab-register');

  heading.textContent = isLogin ? 'Selamat datang kembali' : 'Buat akun baru';
  subheading.textContent = isLogin
    ? 'Masuk ke panel pengelolaan LogoKu.'
    : 'Daftarkan email Anda untuk akses dashboard.';
  submitBtn.textContent = isLogin ? 'Masuk' : 'Daftar';
  switchPrompt.textContent = isLogin ? 'Belum punya akun?' : 'Sudah punya akun?';
  switchAction.textContent = isLogin ? 'Daftar di sini' : 'Masuk di sini';

  // Register-only / login-only field visibility
  fieldFullname.hidden = isLogin;
  inputFullname.required = !isLogin;
  loginExtras.hidden = !isLogin;
  passwordHint.hidden = isLogin;

  // autocomplete hint for password managers
  inputPassword.setAttribute('autocomplete', isLogin ? 'current-password' : 'new-password');

  clearStatus();

  // focus management: move focus to first relevant field
  if (isLogin) {
    inputEmail.focus();
  } else {
    inputFullname.focus();
  }
}

// ---------- auth actions ----------
async function login(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    showError(friendlyAuthError(error));
    return;
  }
  // Approval is enforced by RLS on the dashboard; redirect on success.
  window.location.href = DASHBOARD_URL;
}

async function register(email, password, fullName) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error) {
    showError(friendlyAuthError(error));
    return;
  }
  // A DB trigger provisions admin_profiles with role='pending'.
  showOk('Akun dibuat. Menunggu persetujuan admin sebelum bisa mengakses dashboard.');
  // Reset sensitive field and return to login mode for clarity.
  inputPassword.value = '';
  if (data?.session) {
    // If a session was created (email confirmation disabled), sign out so a
    // pending account cannot linger as authenticated.
    await supabase.auth.signOut().catch(() => {});
  }
}

// ---------- form submit ----------
async function onSubmit(event) {
  event.preventDefault();
  if (inFlight || !supabase) return;
  clearStatus();

  const email = inputEmail.value.trim();
  const password = inputPassword.value;

  if (!email) {
    showError('Email wajib diisi.');
    inputEmail.focus();
    return;
  }
  if (!password) {
    showError('Kata sandi wajib diisi.');
    inputPassword.focus();
    return;
  }

  if (mode === 'register') {
    const fullName = inputFullname.value.trim();
    if (!fullName) {
      showError('Nama lengkap wajib diisi.');
      inputFullname.focus();
      return;
    }
    // Client-side length check (server/Supabase still enforces its own rules).
    if (password.length < MIN_PASSWORD_LENGTH) {
      showError(`Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter.`);
      inputPassword.focus();
      return;
    }
    setInFlight(true, 'Mendaftar…');
    try {
      await register(email, password, fullName);
    } catch (err) {
      showError(friendlyAuthError(err));
    } finally {
      setInFlight(false);
    }
    return;
  }

  // login
  setInFlight(true, 'Masuk…');
  try {
    await login(email, password);
  } catch (err) {
    showError(friendlyAuthError(err));
  } finally {
    setInFlight(false);
  }
}

// ---------- forgot password ----------
async function onForgotPassword() {
  if (inFlight || !supabase) return;
  clearStatus();
  const email = inputEmail.value.trim();
  if (!email) {
    showError('Isi email Anda terlebih dahulu untuk mengatur ulang sandi.');
    inputEmail.focus();
    return;
  }
  setInFlight(true, 'Memproses…');
  try {
    const redirectTo = `${window.location.origin}/login.html`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) {
      showError(friendlyAuthError(error));
      return;
    }
    showOk('Jika email terdaftar, tautan atur ulang sandi telah dikirim.');
  } catch (err) {
    showError(friendlyAuthError(err));
  } finally {
    setInFlight(false);
  }
}

// ---------- session bootstrap ----------
async function redirectIfApprovedAdmin() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data: profile, error } = await supabase
      .from('admin_profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();
    if (error) return;
    if (profile && ['admin', 'owner'].includes(profile.role)) {
      window.location.href = DASHBOARD_URL;
    }
  } catch {
    // Non-fatal: stay on the login page.
  }
}

// ---------- wire up ----------
function init() {
  if (!supabase) {
    disableForms('Supabase belum dikonfigurasi. Atur SUPABASE_URL dan SUPABASE_ANON_KEY di assets/js/env.js.');
    return;
  }

  tabLogin.addEventListener('click', () => setMode('login'));
  tabRegister.addEventListener('click', () => setMode('register'));
  switchAction.addEventListener('click', () => setMode(mode === 'login' ? 'register' : 'login'));
  forgotBtn.addEventListener('click', onForgotPassword);
  form.addEventListener('submit', onSubmit);

  redirectIfApprovedAdmin();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
