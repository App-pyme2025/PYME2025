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
    return showMsg(
      'El usuario no existe o hay un error en tus credenciales (Usuario/contraseña)'
    );
  }

  setupIdleWatcher();
  window.location.href = 'dashboard.html';
});

// 2) Registro nuevo usuario (solo al hacer clic)
document.getElementById('register-btn')?.addEventListener('click', e => {
  e.preventDefault();
  window.location.href = 'solicitud.html';
});

// 3) OAuth Google
document.getElementById('google-btn')?.addEventListener('click', async () => {
  const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
  if (error) showMsg(error.message);
});

// 4) Funcionalidad Modal Reset Password
const resetBtn        = document.getElementById('reset-btn');
const resetModal      = document.getElementById('reset-modal');
const resetCancelBtn  = document.getElementById('reset-cancel-btn');
const resetSubmitBtn  = document.getElementById('reset-submit-btn');
const resetEmailInput = document.getElementById('reset-email-input');
const resetMsgModal   = document.getElementById('reset-msg');

// Abrir modal
resetBtn?.addEventListener('click', e => {
  e.preventDefault();
  showMsg('');
  resetEmailInput.value = '';
  resetMsgModal.textContent = '';
  resetMsgModal.style.color = 'red';
  resetModal.classList.remove('hidden');
});

// Cerrar modal con botón
resetCancelBtn?.addEventListener('click', () => {
  resetModal.classList.add('hidden');
});

// Cerrar modal al clic fuera del contenido
resetModal?.addEventListener('click', e => {
  if (e.target === resetModal) {
    resetModal.classList.add('hidden');
  }
});

// Enviar solicitud de restablecer contraseña
resetSubmitBtn?.addEventListener('click', async () => {
  const email = resetEmailInput.value.trim();
  if (!email) {
    resetMsgModal.textContent = 'Ingresa un correo válido';
    return;
  }

  // Validar que el correo está registrado
  const { data: exists, error: rpcError } = await supabase.rpc('email_exists', { p_email: email });
  if (rpcError) {
    console.error('RPC error:', rpcError);
    resetMsgModal.textContent = 'Error al verificar el correo';
    return;
  }
  if (!exists) {
    resetMsgModal.textContent = 'Ese correo no está registrado';
    return;
  }

  // Enviar correo de restablecimiento
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) {
    resetMsgModal.textContent = error.message;
  } else {
    resetMsgModal.style.color = 'green';
    resetMsgModal.textContent = 'Revisa tu correo para el enlace';
  }
});