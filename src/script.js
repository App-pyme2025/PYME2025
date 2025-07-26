// src/script.js

import { supabase } from './supabaseClient.js';

//
// 1. Verificar sesión al cargar la página
//
document.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role_id')
      .eq('id', session.user.id)
      .single();

    if (!error && profile) {
      redirectByRole(profile.role_id);
    }
  }
});

//
// 2. Módulo de login
//
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    const msg = document.getElementById('msg');
    msg.textContent = '';

    const { email, password } = Object.fromEntries(new FormData(loginForm));
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      msg.textContent = error.message;
      return;
    }

    const user = data.user;
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role_id, full_name')
      .eq('id', user.id)
      .single();

    if (profileError) {
      msg.textContent = 'No se pudo recuperar el perfil';
      console.error(profileError);
      return;
    }

    msg.textContent = `¡Bienvenido ${profile.full_name}!`;
    setTimeout(() => redirectByRole(profile.role_id), 800);
  });
}

//
// 3. Módulo de alta de usuario
//
const addUserForm = document.getElementById('add-user');
if (addUserForm) {
  addUserForm.addEventListener('submit', async e => {
    e.preventDefault();
    const statusMsg = document.getElementById('status');
    statusMsg.textContent = '';

    const full_name = document.getElementById('name').value.trim();
    const role_id   = Number(document.getElementById('role').value);
    const email     = document.getElementById('email').value.trim();
    const password  = document.getElementById('pass').value;

    // 3.1 Crear cuenta en Auth
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) {
      statusMsg.textContent = signUpError.message;
      return;
    }

    // 3.2 Insertar perfil en la tabla
    const { error: insertError } = await supabase
      .from('profiles')
      .insert([{ id: signUpData.user.id, full_name, role_id }]);

    if (insertError) {
      statusMsg.textContent = insertError.message;
      return;
    }

    statusMsg.textContent = 'Usuario creado con éxito';
    addUserForm.reset();
  });
}

//
// 4. Módulo de logout
//
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = 'login.html';
  });
}

//
// 5. Función auxiliar de redirección según rol
//
function redirectByRole(role_id) {
  switch (role_id) {
    case 1: window.location.href = 'superusuario.html'; break;
    case 2: window.location.href = 'dashboard.html';     break;
    case 3: window.location.href = 'admin.html';         break;
    case 4: window.location.href = 'auditoria.html';     break;
    case 5: window.location.href = 'servicios.html';     break;
    case 6: window.location.href = 'ventas.html';        break;
    case 7: window.location.href = 'caja.html';          break;
    default: window.location.href = 'login.html';
  }
}
// MÓDULO: Alta de Usuarios por RRHH
const addUserForm = document.getElementById('add-user');
if (addUserForm) {
  addUserForm.addEventListener('submit', async e => {
    e.preventDefault();
    const status = document.getElementById('status');
    status.textContent = '';

    // Recoge valores del formulario
    const data = Object.fromEntries(new FormData(addUserForm));
    const {
      full_name, email, phone, address,
      emergency_phone, emergency_contact,
      photo_url, password, nss,
      rfc, curp, blood_type, role_id
    } = data;

    // 1) Crear usuario en Auth y perfil en Profiles
    const { error: fnError } = await supabase.rpc(
      'create_user_with_profile',
      { p_email: email,
        p_password: password,
        p_full_name: full_name,
        p_phone: phone,
        p_address: address,
        p_emergency_phone: emergency_phone,
        p_emergency_contact: emergency_contact,
        p_role_id: Number(role_id)
      }
    );

    if (fnError) {
      status.textContent = fnError.message;
      return;
    }

    status.textContent = 'Usuario registrado con éxito.';
    addUserForm.reset();
  });
}