// src/script.js

import { supabase } from './supabaseClient.js';

function showMsg(text) {
  const el = document.getElementById('msg');
  el && (el.textContent = text);
}

// 30 minutos de inactividad -> cerrar sesión
const IDLE_TIMEOUT = 30 * 60 * 1000;
function resetIdleTimer() {
  localStorage.setItem('lastActivity', Date.now().toString());
}
function setupIdleWatcher() {
  resetIdleTimer();
  ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'].forEach(evt =>
    document.addEventListener(evt, resetIdleTimer)
  );
  setInterval(async () => {
    const last = parseInt(localStorage.getItem('lastActivity') || '0', 10);
    if (Date.now() - last > IDLE_TIMEOUT) {
      await supabase.auth.signOut();
      window.location.href = 'login.html?sessionExpired=true';
    }
  }, 60 * 1000);
}

// Al cargar la página: si hay sesión activa, iniciar watcher y redirigir al dashboard
window.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    setupIdleWatcher();
    window.location.href = 'dashboard.html';
  }
});

// 1) Login con email/clave
document.getElementById('login-form')?.addEventListener('submit', async e => {
  e.preventDefault();
  showMsg('');
  const email    = document.getElementById('login-id').value.trim();
  const password = document.getElementById('login-password').value;

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    // Ya no redirige a alta; solo muestra mensaje de credenciales inválidas
    return showMsg(
      'El usuario no existe o hay un error en tus credenciales (Usuario/contraseña)'
    );
  }

  // Éxito: iniciar watcher y enviar al dashboard
  setupIdleWatcher();
  window.location.href = 'dashboard.html';
});

// 2) Recuperar contraseña
document.getElementById('reset-btn')?.addEventListener('click', async e => {
  e.preventDefault();
  showMsg('');
  const email = document.getElementById('login-id').value.trim();
  if (!email) return showMsg('Ingresa tu correo para recuperar contraseña');

  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) return showMsg(error.message);
  showMsg('Revisa tu correo para restablecer contraseña');
});

// 3) Registro nuevo usuario (solo al hacer clic)
document.getElementById('register-btn')?.addEventListener('click', e => {
  e.preventDefault();
  window.location.href = 'solicitud.html';
});

// 4) OAuth Google
document.getElementById('google-btn')?.addEventListener('click', async () => {
  const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
  if (error) showMsg(error.message);
});