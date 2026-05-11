const AuthGuard = (function () {

  const SESSION_KEY = 'if_admin_session';
  const EXPIRY_KEY  = 'if_admin_expiry';
  const SHEETS_URL  = 'https://script.google.com/macros/s/AKfycbx_Lap_lkvgk0xKIzTGp5joffnGEJrfNr9ltvPsWTCt8RkXw2pXXPomT3dpdslFo5I/exec';

  /* ── helpers ── */
  function getToken()  { try { return sessionStorage.getItem(SESSION_KEY); } catch(e) { return null; } }
  function getExpiry() { try { return Number(sessionStorage.getItem(EXPIRY_KEY))||0; } catch(e) { return 0; } }

  function clearSession() {
    try {
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(EXPIRY_KEY);
    } catch(e) {}
  }

  function redirectToLogin(reason) {
    clearSession();
    const q = reason ? '?reason=' + encodeURIComponent(reason) : '';
    window.location.replace('admin.html' + q);
  }

  function showLoader() {
    if (document.getElementById('_ag_loader')) return;

    const div = document.createElement('div');
    div.id = '_ag_loader';
    div.style.position = 'fixed';
    div.style.inset = '0';
    div.style.zIndex = '99999';
    div.style.background = '#fbfbfd';
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.justifyContent = 'center';
    div.style.fontFamily = 'Inter,system-ui,sans-serif';
    div.innerHTML = '<div>Checking session…</div>';

    document.body.appendChild(div);
  }

  function hideLoader() {
    const loader = document.getElementById('_ag_loader');
    if (loader) loader.remove();
  }

  async function verifyWithServer(token) {

    const res = await fetch(SHEETS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        action: 'verifyToken',
        token: token
      })
    });

    if (!res.ok) throw new Error('Server error');

    return res.json();
  }

  return {

    protect: async function (options) {
      options = options || {};
      showLoader();

      const token  = getToken();
      const expiry = getExpiry();

      // No token
      if (!token) {
        redirectToLogin('Please sign in');
        return;
      }

      // Client expiry
      if (Date.now() >= expiry) {
        redirectToLogin('Session expired');
        return;
      }

      // SERVER VERIFICATION (NO FALLBACK)
      try {
        const data = await verifyWithServer(token);

        if (data.valid === true) {
          hideLoader();
          if (typeof options.onReady === 'function') options.onReady();
        } else {
          redirectToLogin('Session invalid');
        }

      } catch (err) {
        console.error('Auth verification failed:', err);
        redirectToLogin('Server unreachable — please login again');
      }
    },

    signIn: function (token, expiry) {
      try {
        sessionStorage.setItem(SESSION_KEY, token);
        sessionStorage.setItem(EXPIRY_KEY, expiry);
      } catch(e) {}
    },

    signOut: function () {
      clearSession();
      window.location.replace('admin.html');
    },

    isSignedIn: function () {
      return !!(getToken() && Date.now() < getExpiry());
    },

    getToken: getToken
  };

})();