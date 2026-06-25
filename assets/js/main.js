// Shared landing UI behaviors: mobile nav toggle, FAQ accordion, WA links.
import { ADMIN_WHATSAPP_NUMBER } from './lib/supabaseClient.js';
import { buildWaConsult } from './lib/wa.js';

function initWaLinks() {
  const href = buildWaConsult(ADMIN_WHATSAPP_NUMBER);
  document.querySelectorAll('[data-wa-consult]').forEach((a) => { a.href = href; });
}

function initMobileNav() {
  const btn = document.getElementById('mobileMenuBtn');
  const menu = document.getElementById('navMenu');
  if (!btn || !menu) return;
  btn.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Tutup menu' : 'Buka menu');
  });
  // close after clicking a link (mobile)
  menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => {
    menu.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  }));
}

function initFaq() {
  document.querySelectorAll('.faq-item').forEach((item) => {
    const q = item.querySelector('.faq-q');
    if (!q) return;
    q.addEventListener('click', () => {
      const open = item.classList.toggle('open');
      q.setAttribute('aria-expanded', String(open));
    });
  });
}

function init() {
  initWaLinks();
  initMobileNav();
  initFaq();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
