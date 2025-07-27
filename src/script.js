// src/script.js
import { supabase } from './supabaseClient.js';

function showMsg(text) {
  const el = document.getElementById('msg');
  el && (el.textContent = text);
}

// 1) Login con email/clave
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async e => {
    e.preventDefault(); showMsg('');
    const email    = document.getElementById('login-id').value.trim();
    const password = document.getElementById('login-password').value;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.status === 400) return window.location.href = 'solicitud.html';
      return showMsg(error.message);
    }
    window.location.href = 'dashboard.html';
  });
}

// 2) Recuperar contraseña
document.getElementById('reset-btn').addEventListener('click', async e => {
  e.preventDefault(); showMsg('');
  const email = document.getElementById('login-id').value.trim();
  if (!email) return showMsg('Ingresa tu correo para recuperar contraseña');
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) return showMsg(error.message);
  showMsg('Revisa tu correo para restablecer contraseña');
});

// 3) Registrarse
document.getElementById('register-btn').addEventListener('click', e => {
  e.preventDefault();
  window.location.href = 'solicitud.html';
});

// 4) OAuth Google
document.getElementById('google-btn').addEventListener('click', async () => {
  const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
  error && showMsg(error.message);
});