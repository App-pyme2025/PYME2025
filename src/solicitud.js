import { supabase } from './supabaseClient.js';

window.addEventListener('DOMContentLoaded', () => {
  const form       = document.getElementById('request-form');
  const fullNameEl = document.getElementById('req-full-name');
  const emailEl    = document.getElementById('req-email');
  const passEl     = document.getElementById('req-password');
  const pass2El    = document.getElementById('req-password-confirm');
  const msgEl      = document.getElementById('req-msg');

  form?.addEventListener('submit', async e => {
    e.preventDefault();
    msgEl.textContent = '';
    msgEl.style.color = 'red';

    const fullName = fullNameEl.value.trim();
    const email    = emailEl.value.trim();
    const password = passEl.value;
    const confirm  = pass2El.value;

    if (!fullName || !email || !password) {
      msgEl.textContent = 'Completa todos los campos.';
      return;
    }
    if (password !== confirm) {
      msgEl.textContent = 'Las contraseñas no coinciden.';
      return;
    }

    // 1) Crear cuenta en Auth
    const { data: signData, error: signError } = await supabase.auth.signUp({
      email,
      password
    });
    if (signError) {
      msgEl.textContent = signError.message;
      return;
    }

    const user = signData.user;
    if (!user) {
      msgEl.textContent = 'Error al crear la cuenta.';
      return;
    }

    // 2) Guardar perfil con role_id = 0 (pendiente)
    const { error: profError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        full_name: fullName,
        email,
        role_id: 0
      });
    if (profError) {
      msgEl.textContent = profError.message;
      return;
    }

    // 3) Éxito
    msgEl.style.color = 'green';
    msgEl.textContent = 'Solicitud enviada. Espera autorización de tu cuenta.';
    form.reset();
  });
});