/* auth.js — Supabase Authentication & Session Management Module */

const ADMIN_EMAIL  = 'zaa.law.co@gmail.com';
const SUPABASE_URL = 'https://pnmuvfxfdikwfusufobe.supabase.co';
const SUPABASE_KEY = 'sb_publishable_0Srpj1AJc-VJMxbbaN_-UA_K2dn4_R8';

let supabaseClient = null;

if (typeof supabase !== 'undefined') {
  supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  window.supabaseClient = supabaseClient;
} else {
  console.warn("Supabase library not loaded yet.");
}

/* ── Auth State Listener ── */
if (supabaseClient) {
  supabaseClient.auth.onAuthStateChange((event, session) => {
    if (session) {
      const email = session.user.email;
      localStorage.setItem('lf_session', JSON.stringify({
        id:       session.user.id,
        name:     session.user.user_metadata.full_name || email,
        phone:    session.user.user_metadata.phone || '',
        email:    email,
        is_admin: email.toLowerCase() === ADMIN_EMAIL.toLowerCase()
      }));
    } else {
      localStorage.removeItem('lf_session');
    }
    window.dispatchEvent(new Event('auth-state-changed'));
  });
}

/* ── Public API ── */

function isLoggedIn() {
  return !!localStorage.getItem('lf_session');
}

function getCurrentUser() {
  const s = localStorage.getItem('lf_session');
  return s ? JSON.parse(s) : null;
}

async function authRegister(name, phone, email, password) {
  if (!supabaseClient) return { ok: false, error: 'تعذر الاتصال بخادم قاعدة البيانات.' };
  if (!name || !phone || !email || !password) {
    return { ok: false, error: 'يرجى تعبئة جميع الحقول المطلوبة.' };
  }
  
  try {
    const { data, error } = await supabaseClient.auth.signUp({
      email: email.trim().toLowerCase(),
      password: password,
      options: {
        data: {
          full_name: name.trim(),
          phone: phone.trim()
        }
      }
    });

    if (error) {
      return { ok: false, error: translateAuthError(error.message) };
    }
    
    return { ok: true, user: data.user };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function authLogin(email, password) {
  if (!supabaseClient) return { ok: false, error: 'تعذر الاتصال بخادم قاعدة البيانات.' };
  if (!email || !password) {
    return { ok: false, error: 'يرجى إدخال البريد الإلكتروني وكلمة المرور.' };
  }

  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: password
    });

    if (error) {
      return { ok: false, error: translateAuthError(error.message) };
    }

    return { ok: true, user: data.user };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function authLogout() {
  if (supabaseClient) {
    await supabaseClient.auth.signOut();
  }
  localStorage.removeItem('lf_session');
}

function requireAuth(returnUrl) {
  if (!isLoggedIn()) {
    const dest = returnUrl || window.location.href;
    window.location.href = '../pages/auth.html?return=' + encodeURIComponent(dest);
    return false;
  }
  return true;
}

function requireAuthFromRoot(returnUrl) {
  if (!isLoggedIn()) {
    const dest = returnUrl || window.location.href;
    window.location.href = 'pages/auth.html?return=' + encodeURIComponent(dest);
    return false;
  }
  return true;
}

/* ── Error Translation Helper ── */
function translateAuthError(msg) {
  if (!msg) return 'حدث خطأ غير متوقع.';
  const lower = msg.toLowerCase();
  if (lower.includes('invalid login credentials')) return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
  if (lower.includes('user already exists')) return 'هذا البريد الإلكتروني مسجل بالفعل.';
  if (lower.includes('password should be')) return 'يجب أن تكون كلمة المرور 6 خانات على الأقل.';
  if (lower.includes('email rate limit')) return 'تم إرسال طلبات كثيرة جداً، يرجى المحاولة لاحقاً.';
  return msg;
}

/* ── Expose globals ── */
window.isLoggedIn           = isLoggedIn;
window.getCurrentUser       = getCurrentUser;
window.authRegister         = authRegister;
window.authLogin            = authLogin;
window.authLogout           = authLogout;
window.requireAuth          = requireAuth;
window.requireAuthFromRoot  = requireAuthFromRoot;
