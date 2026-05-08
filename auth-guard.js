const AuthGuard = (function () {

  const SESSION_KEY = 'if_admin_session'; // exact key your admin.html uses
  const EXPIRY_KEY  = 'if_admin_expiry';  // exact key your admin.html uses
  const SHEETS_URL  = 'https://script.google.com/macros/s/AKfycbzNZQta6R4aCjmGzCspHgkzou019uK2k1uGtzgVi8XL-aVtROQC61Ht77k9grdsOg4/exec';

  function getToken() {
    try { return sessionStorage.getItem(SESSION_KEY); } catch(e) { return null; }
  }

  function getExpiry() {
    try { return Number(sessionStorage.getItem(EXPIRY_KEY)) || 0; } catch(e) { return 0; }
  }

  function clearSession() {
    try {
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(EXPIRY_KEY);
    } catch(e) {}
  }

  function redirectToLogin(reason) {
    clearSession();
    const msg = reason ? '?reason=' + encodeURIComponent(reason) : '';
    window.location.replace('admin.html' + msg);
  }

  return {

    protect: function (options) {
      options = options || {};

      // Hide page IMMEDIATELY — nothing visible to unauthenticated users
      document.documentElement.style.visibility = 'hidden';

      const token  = getToken();
      const expiry = getExpiry();

      // 1. No token at all → instant redirect
      if (!token) {
        redirectToLogin('Please sign in to continue');
        return;
      }

      // 2. Client-side expiry check (same logic as your admin.html)
      if (Date.now() >= expiry) {
        redirectToLogin('Session expired — please sign in again');
        return;
      }

      // 3. Server-side token verification (same fetch style as your admin.html)
      fetch(SHEETS_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'text/plain' }, // matches your admin.html exactly
        body:    JSON.stringify({ action: 'verifyToken', token: token }),
        redirect: 'follow'
      })
        .then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.json();
        })
        .then(function (data) {
          if (data.valid === true) {
            // ✓ Auth passed — show page and boot the app
            document.documentElement.style.visibility = '';
            if (typeof options.onReady === 'function') options.onReady();
          } else {
            // Token rejected by server (expired server-side or deleted)
            redirectToLogin('Session expired — please sign in again');
          }
        })
        .catch(function (err) {
          // Network error — token + client expiry already passed,
          // allow through gracefully rather than locking out during a match
          console.warn('AuthGuard: server unreachable, falling back to client check', err);
          document.documentElement.style.visibility = '';
          if (typeof options.onReady === 'function') options.onReady();
        });
    },

    signIn: function (token) {
      // Not needed — admin.html handles its own signIn
      // Included for completeness
      try { sessionStorage.setItem(SESSION_KEY, token); } catch(e) {}
    },

    signOut: function (showModalFn) {
      const token = getToken();

      // Best-effort server invalidation — mirrors your doLogout() exactly
      const invalidate = token
        ? fetch(SHEETS_URL, {
            method:  'POST',
            headers: { 'Content-Type': 'text/plain' },
            body:    JSON.stringify({ action: 'logout', token: token }),
            redirect: 'follow'
          }).catch(function () {})
        : Promise.resolve();

      function doRedirect() {
        invalidate.finally
          ? invalidate.finally(function () { clearSession(); window.location.replace('admin.html'); })
          : (clearSession(), window.location.replace('admin.html'));
      }

      if (typeof showModalFn === 'function') {
        showModalFn(
          'Sign Out',
          'Are you sure you want to sign out?',
          'Sign Out',
          false,
          doRedirect
        );
      } else {
        doRedirect();
      }
    },

    isSignedIn: function () {
      const token  = getToken();
      const expiry = getExpiry();
      return !!(token && Date.now() < expiry);
    },

    getToken: getToken

  };

})();