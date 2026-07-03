'use strict';

/* ── Page Loader ── */
window.addEventListener('load', () => {
  setTimeout(() => {
    const l = document.getElementById('loader');
    if (l) { l.classList.add('out'); setTimeout(() => l.remove(), 600); }
  }, 1900);
});

/* ── Navbar ── */
const nav = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 70);
  updateActiveNav();
  updateScrollTop();
}, { passive: true });

function updateActiveNav() {
  const ids = ['hero','about','services','process','blog','contact'];
  const y   = window.scrollY + 130;
  ids.forEach(id => {
    const el  = document.getElementById(id);
    const nl  = document.getElementById('n-' + id);
    if (!el || !nl) return;
    const active = el.offsetTop <= y && el.offsetTop + el.offsetHeight > y;
    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
    if (active) nl.classList.add('active');
  });
}

/* ── Mobile Menu ── */
function toggleMenu() {
  document.getElementById('mobileMenu').classList.toggle('open');
}

/* ── Scroll Top ── */
function updateScrollTop() {
  const btn = document.getElementById('top-btn');
  if (btn) btn.classList.toggle('show', window.scrollY > 500);
}

/* ── Counter ── */
function animateCount(el, target, dur = 1600) {
  let s;
  const step = ts => {
    if (!s) s = ts;
    const p = Math.min((ts - s) / dur, 1);
    const e = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.floor(e * target);
    if (p < 1) requestAnimationFrame(step);
    else el.textContent = target;
  };
  requestAnimationFrame(step);
}

/* ── Intersection Observer ── */
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('vis');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.03, rootMargin: '0px 0px 0px 0px' });

document.querySelectorAll('.reveal, .reveal-l, .reveal-r, .stagger').forEach(el => io.observe(el));

/* ── Counter Observer ── */
const cio = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.querySelectorAll('.stat-num[data-target]').forEach(n => {
        animateCount(n, parseInt(n.dataset.target, 10));
      });
      cio.unobserve(e.target);
    }
  });
}, { threshold: 0.3 });

const statsRow = document.querySelector('.stats-row');
if (statsRow) cio.observe(statsRow);

/* ── FAQ ── */
function toggleFaq(item) {
  const a = item.querySelector('.faq-a');
  const open = item.classList.contains('open');
  document.querySelectorAll('.faq-item.open').forEach(i => {
    i.classList.remove('open');
    i.querySelector('.faq-a').style.maxHeight = '0';
  });
  if (!open) {
    item.classList.add('open');
    a.style.maxHeight = a.scrollHeight + 'px';
  }
}

/* ── Vision/Mission ── */
function switchVM(id, btn) {
  document.querySelectorAll('.vm-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.vm-tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('vm-' + id).classList.add('active');
  btn.classList.add('active');
}

/* ── Language Toggle ── */
function toggleLang() {
  const btn = document.getElementById('langBtn');
  const isAr = document.documentElement.lang === 'ar';
  document.documentElement.lang = isAr ? 'en' : 'ar';
  document.documentElement.dir  = isAr ? 'ltr' : 'rtl';
  btn.textContent = isAr ? 'AR' : 'EN';
}


/* ── Contact Form ── */
async function handleContact(e) {
  e.preventDefault();
  const form = e.target;
  const btn  = form.querySelector('button[type="submit"]');
  const ok   = document.getElementById('cSuccess');
  
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الإرسال...';
  btn.disabled  = true;

  // Read all form fields
  const inputs   = form.querySelectorAll('input, select, textarea');
  const name     = inputs[0]?.value?.trim() || '';
  const phone    = inputs[1]?.value?.trim() || '';
  const email    = inputs[2]?.value?.trim() || '';
  const service  = inputs[3]?.value || '';
  const message  = inputs[4]?.value?.trim() || '';

  // Save to Supabase
  if (window.supabaseClient) {
    try {
      await window.supabaseClient.from('contact_messages').insert([{
        name, phone, email, service, message, status: 'جديد'
      }]);
    } catch (err) {
      console.error('Supabase contact save error:', err);
    }
  }

  // Fallback localStorage
  const msgs = JSON.parse(localStorage.getItem('lf_messages') || '[]');
  msgs.push({ name, phone, email, service, message, date: new Date().toISOString() });
  localStorage.setItem('lf_messages', JSON.stringify(msgs));

  setTimeout(() => {
    btn.style.display = 'none';
    ok.style.display  = 'block';
    form.reset();
  }, 600);
}

/* ── CTA type selector ── */
function selType(n) {
  document.querySelectorAll('[id^="ct"]').forEach((el,i) => {
    el.classList.toggle('sel', i+1 === n);
  });
}

/* ── Smooth anchor scroll ── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', function(e) {
    const id = this.getAttribute('href').slice(1);
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    window.scrollTo({ top: el.offsetTop - nav.offsetHeight - 12, behavior: 'smooth' });
  });
});

/* ── Subtle parallax hero ── */
const heroContent = document.querySelector('.hero-content');
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  if (heroContent && y < window.innerHeight * 1.2) {
    heroContent.style.transform = `translateY(${y * 0.18}px)`;
    heroContent.style.opacity = Math.max(0, 1 - y / (window.innerHeight * 0.7));
  }
}, { passive: true });

/* ── Service card hover (light tilt) ── */
document.querySelectorAll('.svc-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    const x = e.clientX - r.left - r.width/2;
    const y = e.clientY - r.top - r.height/2;
    card.style.transform = `translateY(-1px) perspective(400px) rotateX(${-y/40}deg) rotateY(${x/40}deg)`;
  });
  card.addEventListener('mouseleave', () => { card.style.transform = ''; });
});
