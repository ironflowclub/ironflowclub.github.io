const AuthGuard = (function () {

  const SESSION_KEY = 'if_admin_session';
  const EXPIRY_KEY  = 'if_admin_expiry';
  const SHEETS_URL  = 'https://script.google.com/macros/s/AKfycbzNZQta6R4aCjmGzCspHgkzou019uK2k1uGtzgVi8XL-aVtROQC61Ht77k9grdsOg4/exec';

  /* ── helpers ── */
  function getToken()  { try { return sessionStorage.getItem(SESSION_KEY); }         catch(e) { return null; } }
  function getExpiry() { try { return Number(sessionStorage.getItem(EXPIRY_KEY))||0; } catch(e) { return 0;    } }
  function clearSession() {
    try { sessionStorage.removeItem(SESSION_KEY); sessionStorage.removeItem(EXPIRY_KEY); } catch(e) {}
  }
  function redirectToLogin(reason) {
    clearSession();
    const q = reason ? '?reason=' + encodeURIComponent(reason) : '';
    window.location.replace('admin.html' + q);
  }

  /* ── loader overlay ── */
  function showLoader() {
    // Inject a full-screen loader so the page content is covered
    // but the browser doesn't show a white void
    const existing = document.getElementById('_ag_loader');
    if (existing) return;

    const style = document.createElement('style');
    style.id = '_ag_style';
    style.textContent = [
      '#_ag_loader{',
        'position:fixed;inset:0;z-index:99999;',
        'background:#fbfbfd;',          /* matches your --bg */
        'display:flex;flex-direction:column;',
        'align-items:center;justify-content:center;',
        'gap:16px;',
        'font-family:Inter,system-ui,sans-serif;',
      '}',
      '#_ag_loader .ag-logo{',
        'width:48px;height:48px;border-radius:12px;',
        'background:linear-gradient(135deg,#ffc107,#ff9800);',
        'display:flex;align-items:center;justify-content:center;',
        'font-size:22px;',
      '}',
      '#_ag_loader .ag-text{',
        'font-size:13px;font-weight:600;color:rgba(17,20,28,.45);',
        'letter-spacing:.04em;',
      '}',
      '#_ag_loader .ag-spinner{',
        'width:20px;height:20px;',
        'border:2px solid rgba(17,20,28,.10);',
        'border-top-color:rgba(17,20,28,.50);',
        'border-radius:50%;',
        'animation:_ag_spin .7s linear infinite;',
      '}',
      '@keyframes _ag_spin{to{transform:rotate(360deg)}}'
    ].join('');
    document.head.appendChild(style);

    const div = document.createElement('div');
    div.id = '_ag_loader';
    div.innerHTML = '<div class="ag-logo">🏸</div>'
                  + '<div class="ag-spinner"></div>'
                  + '<div class="ag-text">Checking session…</div>';
    document.body.appendChild(div);
  }

  function hideLoader() {
    const loader = document.getElementById('_ag_loader');
    const style  = document.getElementById('_ag_style');
    if (loader) {
      loader.style.opacity    = '0';
      loader.style.transition = 'opacity .2s';
      setTimeout(function () {
        if (loader.parentNode) loader.parentNode.removeChild(loader);
        if (style  && style.parentNode)  style.parentNode.removeChild(style);
      }, 220);
    }
    // Always make sure page is visible
    document.documentElement.style.visibility = '';
    document.body.style.visibility = '';
  }

  /* ── public API ── */
  return {

    protect: function (options) {
      options = options || {};

      // Show loader overlay (page content still rendered underneath,
      // but covered — no white flash, no content leak)
      showLoader();

      const token  = getToken();
      const expiry = getExpiry();

      // 1. No token → redirect immediately
      if (!token) {
        redirectToLogin('Please sign in to continue');
        return;
      }

      // 2. Client-side expiry check
      if (Date.now() >= expiry) {
        redirectToLogin('Session expired — please sign in again');
        return;
      }

      // 3. Server verify — with a timeout so we never hang forever
      const controller = (typeof AbortController !== 'undefined') ? new AbortController() : null;
      const timeoutId  = controller
        ? setTimeout(function () { controller.abort(); }, 6000) // 6s timeout
        : null;

      fetch(SHEETS_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'text/plain' },
        body:    JSON.stringify({ action: 'verifyToken', token: token }),
        redirect: 'follow',
        signal:  controller ? controller.signal : undefined
      })
        .then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.json();
        })
        .then(function (data) {
          clearTimeout(timeoutId);
          if (data.valid === true) {
            hideLoader();
            if (typeof options.onReady === 'function') options.onReady();
          } else {
            redirectToLogin('Session expired — please sign in again');
          }
        })
        .catch(function (err) {
          clearTimeout(timeoutId);
          if (err.name === 'AbortError') {
            console.warn('AuthGuard: verify timed out — using client-side check');
          } else {
            console.warn('AuthGuard: server unreachable — using client-side check', err);
          }
          // Graceful fallback: token exists + client expiry valid → allow through
          hideLoader();
          if (typeof options.onReady === 'function') options.onReady();
        });
    },

    signIn: function (token) {
      try { sessionStorage.setItem(SESSION_KEY, token); } catch(e) {}
    },

    signOut: function (showModalFn) {
      const token = getToken();

      const invalidate = token
        ? fetch(SHEETS_URL, {
            method:  'POST',
            headers: { 'Content-Type': 'text/plain' },
            body:    JSON.stringify({ action: 'logout', token: token }),
            redirect: 'follow'
          }).catch(function () {})
        : Promise.resolve();

      function doRedirect() {
        const finish = function () { clearSession(); window.location.replace('admin.html'); };
        typeof invalidate.finally === 'function'
          ? invalidate.finally(finish)
          : finish();
      }

      if (typeof showModalFn === 'function') {
        showModalFn('Sign Out', 'Are you sure you want to sign out?', 'Sign Out', false, doRedirect);
      } else {
        doRedirect();
      }
    },

    isSignedIn: function () {
      return !!(getToken() && Date.now() < getExpiry());
    },

    getToken: getToken
  };

})();