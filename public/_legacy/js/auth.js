/* ───────────────────────────────────────────────────────────
   auth.js  —  Auth-aware UI controller for Nexus
   • Checks /api/auth/me on every page load
   • Shows / hides nav items via data-auth="guest|user"
   • Exposes window.currentUser, requireAuth(), logout()
   ─────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  /** Currently logged-in user object, or null */
  window.currentUser = null;

  /* ── Auth check ──────────────────────────────────────────── */
  async function checkAuth() {
    try {
      var data = await window.api.get('/api/auth/me');
      window.currentUser = data.user || null;
    } catch (_e) {
      window.currentUser = null;
    }
    updateUI();
    // Fire a custom event so pages can react after auth resolves
    window.dispatchEvent(new CustomEvent('authReady', { detail: window.currentUser }));
  }

  /* ── Toggle nav items ────────────────────────────────────── */
  function updateUI() {
    var guestEls = document.querySelectorAll('[data-auth="guest"]');
    var userEls  = document.querySelectorAll('[data-auth="user"]');

    if (window.currentUser) {
      guestEls.forEach(function (el) { el.style.display = 'none'; });
      userEls.forEach(function (el)  { el.style.display = ''; });

      // Populate avatar initials
      var initial = window.currentUser.name
        ? window.currentUser.name.charAt(0).toUpperCase()
        : '?';
      document.querySelectorAll('.user-nav-avatar').forEach(function (a) {
        a.textContent = initial;
      });

      // Populate any user-name displays
      document.querySelectorAll('.nav-user-name').forEach(function (el) {
        el.textContent = window.currentUser.name;
      });
    } else {
      guestEls.forEach(function (el) { el.style.display = ''; });
      userEls.forEach(function (el)  { el.style.display = 'none'; });
    }
  }

  /* ── Helpers exposed globally ────────────────────────────── */

  /**
   * Redirect to login if not authenticated.
   * @returns {boolean} true if user IS authenticated
   */
  window.requireAuth = function () {
    if (!window.currentUser) {
      var redirect = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = '/login?redirect=' + redirect;
      return false;
    }
    return true;
  };

  /**
   * Log out: clear session cookie and go home.
   */
  window.logout = async function () {
    try { await window.api.post('/api/auth/logout'); } catch (_) { /* ignore */ }
    window.currentUser = null;
    window.location.href = '/';
  };

  /* ── Bootstrap ───────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAuth);
  } else {
    checkAuth();
  }
})();
