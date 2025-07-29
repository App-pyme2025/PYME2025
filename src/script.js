// src/script.js

import { supabase } from './supabaseClient.js';

//
// 0) Auth Guard: protege todas las páginas excepto login.html y solicitud.html
//
(async () => {
  const publicPages = ['login.html', 'solicitud.html'];
  const page = window.location.pathname.split('/').pop();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session && !publicPages.includes(page)) {
    // Redirige al login si no hay sesión
    window.location.href = 'login.html';
  }
})();

//
// 1) Muestra mensaje en el div #msg
//
function showMsg(text) {
  const el = document.getElementById('msg');
  el && (el.textContent = text);
}

//
// 2) Idle watcher: cierra sesión tras 30 min de inactividad
//
const IDLE_TIMEOUT = 30 * 60 * 1000;
function resetIdleTimer() {
  localStorage.setItem('lastActivity', Date.now().toString());
}
function setupIdleWatcher() {
  resetIdleTimer();
  ['click', 'keydown', 'mousemove', 'scroll', 'touchstart']
    .forEach(evt => document.addEventListener(evt, resetIdleTimer));

  setInterval(async () => {
    const last = parseInt(localStorage.getItem('lastActivity') || '0', 10);
    if (Date.now() - last > IDLE_TIMEOUT) {
      await supabase.auth.signOut();
      window.location.href = 'login.html?sessionExpired=true';
    }
  }, 60 * 1000);
}

//
// 3) Si ya hay sesión activa en login, ir al dashboard
//
window.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session && window.location.pathname.endsWith('login.html')) {
    setupIdleWatcher();
    window.location.href = 'dashboard.html';
  }
});

//
// 4) Login con email/contraseña
//
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

//
// 5) Registro nuevo usuario (redirige a solicitud.html)
//
document.getElementById('register-btn')?.addEventListener('click', e => {
  e.preventDefault();
  window.location.href = 'solicitud.html';
});

//
// 6) OAuth Google
//
document.getElementById('google-btn')?.addEventListener('click', async () => {
  const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
  if (error) showMsg(error.message);
});

//
// 7) Modal Reset Password
//
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

// Cerrar modal
resetCancelBtn?.addEventListener('click', () => {
  resetModal.classList.add('hidden');
});
resetModal?.addEventListener('click', e => {
  if (e.target === resetModal) resetModal.classList.add('hidden');
});

// Enviar reset password
resetSubmitBtn?.addEventListener('click', async () => {
  const email = resetEmailInput.value.trim();
  if (!email) {
    resetMsgModal.textContent = 'Ingresa un correo válido';
    return;
  }

  // Validar existencia de correo vía RPC
  const { data: exists, error: rpcError } = await supabase
    .rpc('email_exists', { p_email: email });
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

//
// 8) Módulo de Roles & Permisos (solo en roles.html)
//
const requestsTable   = document.querySelector('#requests-table tbody');
const pendingSection  = document.getElementById('pending-section');
const assignSection   = document.getElementById('assign-section');
const assignForm      = document.getElementById('assign-form');
const userIdInput     = document.getElementById('user-id');
const userNameSpan    = document.getElementById('user-name');
const userEmailSpan   = document.getElementById('user-email');
const roleSelect      = document.getElementById('role-select');
const modulesList     = document.getElementById('modules-list');
const assignMsg       = document.getElementById('assign-msg');
const cancelAssignBtn = document.getElementById('cancel-assign');

async function loadRequests() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id,full_name,email')
    .eq('role_id', 0)
    .order('created_at', { ascending: true });
  if (error) return console.error(error);

  requestsTable.innerHTML = '';
  data.forEach(u => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${u.full_name}</td>
      <td>${u.email}</td>
      <td>
        <button class="authorize-btn"
                data-id="${u.id}"
                data-name="${u.full_name}"
                data-email="${u.email}">
          Autorizar
        </button>
      </td>`;
    requestsTable.appendChild(tr);
  });

  document.querySelectorAll('.authorize-btn')
    .forEach(btn => btn.addEventListener('click', openAssign));
}

async function openAssign(e) {
  const btn   = e.target;
  const id    = btn.dataset.id;
  const name  = btn.dataset.name;
  const email = btn.dataset.email;

  userIdInput.value        = id;
  userNameSpan.textContent = name;
  userEmailSpan.textContent= email;
  assignMsg.textContent    = '';

  // Cargar roles
  const { data: roles, error: errR } = await supabase
    .from('roles').select('id,name').order('id');
  if (errR) return console.error(errR);
  roleSelect.innerHTML = '<option value="">Selecciona rol</option>';
  roles.forEach(r => {
    roleSelect.innerHTML += `<option value="${r.id}">${r.name}</option>`;
  });

  // Cargar módulos
  const { data: modules, error: errM } = await supabase
    .from('modules').select('id,name').order('id');
  if (errM) return console.error(errM);

  // Permisos actuales del usuario
  const { data: userMods } = await supabase
    .from('user_modules')
    .select('module_id')
    .eq('user_id', id);
  const userModIds = userMods.map(um => um.module_id);

  modulesList.innerHTML = '';
  modules.forEach(m => {
    const checked = userModIds.includes(m.id) ? 'checked' : '';
    modulesList.innerHTML += `
      <label>
        <input type="checkbox"
               class="module-checkbox"
               value="${m.id}"
               ${checked}>
        ${m.name}
      </label>`;
  });

  pendingSection.classList.add('hidden');
  assignSection.classList.remove('hidden');
}

cancelAssignBtn?.addEventListener('click', () => {
  assignSection.classList.add('hidden');
  pendingSection.classList.remove('hidden');
});

assignForm?.addEventListener('submit', async e => {
  e.preventDefault();
  assignMsg.className   = '';
  assignMsg.textContent = '';

  const uid    = userIdInput.value;
  const roleId = parseInt(roleSelect.value, 10);
  if (!roleId) {
    assignMsg.className   = 'error';
    assignMsg.textContent = 'Selecciona un rol';
    return;
  }

  // 1) Actualizar role_id
  const { error: err1 } = await supabase
    .from('profiles')
    .update({ role_id: roleId })
    .eq('id', uid);
  if (err1) {
    assignMsg.className   = 'error';
    assignMsg.textContent = err1.message;
    return;
  }

  // 2) Limpiar permisos previos
  await supabase.from('user_modules').delete().eq('user_id', uid);

  // 3) Insertar nuevos permisos
  const inserts = Array.from(
    document.querySelectorAll('.module-checkbox:checked')
  ).map(cb => ({
    user_id: uid,
    module_id: parseInt(cb.value, 10),
    allowed: true
  }));
  if (inserts.length) {
    const { error: err2 } = await supabase
      .from('user_modules')
      .insert(inserts);
    if (err2) {
      assignMsg.className   = 'error';
      assignMsg.textContent = err2.message;
      return;
    }
  }

  assignMsg.textContent = 'Permisos guardados exitosamente';
  await loadRequests();
  setTimeout(() => {
    assignSection.classList.add('hidden');
    pendingSection.classList.remove('hidden');
  }, 1000);
});

// Inicializa Roles si estamos en roles.html
if (requestsTable) {
  loadRequests();
}