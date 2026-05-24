/* ── Service Worker ── */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { scope: './' })
      .catch(err => console.warn('SW registration failed:', err));
  });
}

/* ── PWA Install prompt ── */
let deferredPrompt = null;
const installBtn  = document.getElementById('installBtn');
const iosInstallBtn = document.getElementById('iosInstallBtn');

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  if (installBtn) installBtn.hidden = false;
});

if (installBtn) {
  installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      installBtn.hidden = true;
      deferredPrompt = null;
    }
  });
}

window.addEventListener('appinstalled', () => {
  if (installBtn) installBtn.hidden = true;
  deferredPrompt = null;
});

/* ── iOS detection & banner ── */
function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}
function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && navigator.standalone);
}

const iosBanner    = document.getElementById('iosBanner');
const iosBannerClose = document.getElementById('iosBannerClose');

if (isIOS() && !isStandalone()) {
  const dismissed = sessionStorage.getItem('ios-banner-dismissed');
  if (!dismissed) {
    setTimeout(() => {
      if (iosBanner) iosBanner.hidden = false;
      if (iosInstallBtn) iosInstallBtn.hidden = false;
    }, 3000);
  }
}

if (iosBannerClose) {
  iosBannerClose.addEventListener('click', () => {
    if (iosBanner) iosBanner.hidden = true;
    sessionStorage.setItem('ios-banner-dismissed', '1');
  });
}

if (iosInstallBtn) {
  iosInstallBtn.addEventListener('click', () => {
    if (iosBanner) iosBanner.hidden = false;
  });
}

/* ── Navigation: scroll state & burger menu ── */
const nav       = document.getElementById('nav');
const navBurger = document.getElementById('navBurger');
const navDrawer = document.getElementById('navDrawer');

let ticking = false;
window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      if (nav) nav.classList.toggle('scrolled', window.scrollY > 24);
      ticking = false;
    });
    ticking = true;
  }
}, { passive: true });

if (navBurger && navDrawer) {
  navBurger.addEventListener('click', () => {
    const open = navDrawer.classList.toggle('open');
    navBurger.classList.toggle('open', open);
    navBurger.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  });

  navDrawer.querySelectorAll('.drawer-link, .btn').forEach(el => {
    el.addEventListener('click', () => {
      navDrawer.classList.remove('open');
      navBurger.classList.remove('open');
      navBurger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });
}

/* ── Scroll reveal ── */
const revealObserver = new IntersectionObserver(
  entries => entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  }),
  { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
);

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ── Animated stat counters ── */
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

function animateCounter(el) {
  const target   = parseInt(el.dataset.target, 10);
  const suffix   = el.dataset.suffix || '';
  const divisor  = parseInt(el.dataset.divisor || '1', 10);
  const duration = 1800;
  const startTime = performance.now();

  function tick(now) {
    const elapsed  = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased    = easeOutCubic(progress);
    const current  = Math.floor(eased * target);
    const display  = divisor > 1 ? Math.floor(current / divisor) : current;
    el.textContent = display + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

const counterObserver = new IntersectionObserver(
  entries => entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounter(entry.target);
      counterObserver.unobserve(entry.target);
    }
  }),
  { threshold: 0.5 }
);

document.querySelectorAll('[data-target]').forEach(el => counterObserver.observe(el));

/* ── Contact form ── */
const contactForm = document.getElementById('contactForm');
const submitBtn   = document.getElementById('submitBtn');
const btnText     = document.getElementById('btnText');
const formSuccess = document.getElementById('formSuccess');

if (contactForm) {
  contactForm.addEventListener('submit', async e => {
    e.preventDefault();
    if (!contactForm.checkValidity()) {
      contactForm.reportValidity();
      return;
    }

    // Simulate async submit (no real backend needed for this static PWA)
    if (submitBtn) {
      submitBtn.disabled = true;
      if (btnText) btnText.textContent = 'Sending…';
      submitBtn.style.opacity = '0.75';
    }

    await new Promise(r => setTimeout(r, 1200));

    contactForm.querySelectorAll('input, textarea, button[type="submit"]')
      .forEach(el => { el.disabled = true; el.style.opacity = '0.4'; });

    if (formSuccess) formSuccess.hidden = false;
    formSuccess?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
}

/* ── Smooth scroll for in-page anchors ── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const offset = parseInt(getComputedStyle(document.documentElement)
      .getPropertyValue('--nav-h'), 10) || 64;
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});
