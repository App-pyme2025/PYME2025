// src/script.js
import { supabase } from './supabaseClient.js';

// Mostrar mensajes de error/info
function showMsg(text) {
  const el = document.getElementById('msg');
  el.textContent = text;
}

// 1) Formulario de login
const loginForm = document.getElementById('login-form');
loginForm.addEventListener('submit', async e => {
  e.preventDefault();
  showMsg('');

  const email    = document.getElementById('login-id').value.trim();
  const password = document.getElementById('login-password').value;

  // Sign in con email/contraseña
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Si el email no existe → registro
    if (error.status === 400) {
      return window.location.href = 'solicitud.html';
    }
    return showMsg(error.message);
  }
  // Login correcto → redirigir a dashboard
  window.location.href = 'dashboard.html';
});

// 2) Botón “Recuperar contraseña”
const resetBtn = document.getElementById('reset-btn');
resetBtn.addEventListener('click', async e => {
  e.preventDefault();
  const email = document.getElementById('login-id').value.trim();
  if (!email) return showMsg('Ingresa tu correo para recuperar contraseña');

  const { data, error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) return showMsg(error.message);
  showMsg('Revisa tu correo para restablecer contraseña');
});

// 3) Botón “Registrar nuevo usuario”
const registerBtn = document.getElementById('register-btn');
registerBtn.addEventListener('click', e => {
  e.preventDefault();
  window.location.href = 'solicitud.html';
});

// 4) Botón “Acceso con Google”
const googleBtn = document.getElementById('google-btn');
googleBtn.addEventListener('click', async () => {
  const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
  if (error) showMsg(error.message);
});