/* 15M Autocare cloud sync - loaded after the dashboard application. */
(function () {
  const SUPABASE_URL = 'https://nverrabdiqvwkevufbag.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_g7F7q0quFV3t84VOilAayg_uv3FtKgv';
  const TABLE = 'dashboard_state';
  const ROW_ID = 1;
  let client;
  let syncReady = false;
  let timer;

  function addStyles() {
    if (document.getElementById('supabase-sync-style')) return;
    const style = document.createElement('style');
    style.id = 'supabase-sync-style';
    style.textContent = `
      #cloudSignIn{position:fixed;inset:0;z-index:99999;display:grid;place-items:center;background:rgba(0,0,0,.72);padding:20px;font-family:Arial,sans-serif}
      #cloudSignIn .cloud-card{width:min(430px,100%);background:#fffaf7;border:2px solid #ff5a16;border-radius:18px;padding:28px;color:#24130c;box-shadow:0 20px 60px rgba(0,0,0,.45)}
      #cloudSignIn h2{margin:0 0 8px;color:#e64a0c}.cloud-card p{line-height:1.45}.cloud-card input{box-sizing:border-box;width:100%;padding:12px;border:1px solid #d9c9bf;border-radius:9px;margin:10px 0;font-size:15px}.cloud-card button{width:100%;padding:12px;border:0;border-radius:9px;background:#ff5a16;color:#fff;font-weight:700;cursor:pointer}.cloud-card .cloud-secondary{margin-top:9px;background:transparent;color:#5c3522;border:1px solid #cbb7ab}.cloud-card small{display:block;margin-top:12px;color:#765}
      #cloudStatus{position:fixed;right:14px;bottom:14px;z-index:9990;background:#151515;color:#fff;padding:8px 11px;border-radius:999px;font:12px Arial,sans-serif;box-shadow:0 3px 12px rgba(0,0,0,.25)}
    `;
    document.head.appendChild(style);
  }

  function status(message) {
    let el = document.getElementById('cloudStatus');
    if (!el) { el = document.createElement('div'); el.id = 'cloudStatus'; document.body.appendChild(el); }
    el.textContent = message;
    el.onclick = function () { showSignIn('Sign in whenever you are ready to sync this device.'); };
  }

  function showSignIn(message) {
    addStyles();
    let modal = document.getElementById('cloudSignIn');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'cloudSignIn';
      modal.innerHTML = `<div class="cloud-card"><h2>15M Secure Cloud</h2><p>Sign in with your work email to securely sync the business records across devices. You can also continue using the dashboard now and set up sync later.</p><input id="cloudEmail" type="email" placeholder="Work email address" autocomplete="email"><button id="cloudSendLink" type="button">Send secure sign-in link</button><button id="cloudContinue" class="cloud-secondary" type="button">Continue without cloud sync</button><small id="cloudMessage"></small></div>`;
      document.body.appendChild(modal);
      document.getElementById('cloudSendLink').addEventListener('click', async function () {
        const email = document.getElementById('cloudEmail').value.trim();
        const messageEl = document.getElementById('cloudMessage');
        if (!email) { messageEl.textContent = 'Enter your email address first.'; return; }
        this.disabled = true;
        messageEl.textContent = 'Sending your secure sign-in link...';
        const result = await client.auth.signInWithOtp({ email: email, options: { emailRedirectTo: location.origin + location.pathname } });
        this.disabled = false;
        messageEl.textContent = result.error ? result.error.message : 'Check your email and open the secure sign-in link.';
      });
      document.getElementById('cloudContinue').addEventListener('click', function () {
        modal.remove();
        status('Using this device only - tap here to set up cloud sync');
      });
    }
    document.getElementById('cloudMessage').textContent = message || 'Your records remain protected until you sign in.';
  }

  function hideSignIn() { const modal = document.getElementById('cloudSignIn'); if (modal) modal.remove(); }

  function applyBrandLogo() {
    const logoPath = 'new%20logo%2015m.png';
    const setLogo = function () {
      document.querySelectorAll('.logo, img[alt="15M Autocare logo"], img[src="15m-autocare-logo.png"]').forEach(function (image) {
        if (image.getAttribute('src') !== logoPath) image.src = logoPath;
      });
    };
    setLogo();
    new MutationObserver(setLogo).observe(document.body, { childList: true, subtree: true });
  }

  function protectDashboard() {
    const dashboardButton = Array.from(document.querySelectorAll('.tabs button')).find(function (button) {
      return button.textContent.trim() === 'Dashboard';
    });
    const invoiceButton = Array.from(document.querySelectorAll('.tabs button')).find(function (button) {
      return button.textContent.trim() === 'Invoice Making';
    });
    const dashboard = document.getElementById('dashboard');
    if (!dashboardButton || !dashboard) return;

    const activate = function (id, button) {
      document.querySelectorAll('.tab').forEach(function (section) { section.classList.remove('active'); });
      document.querySelectorAll('.tabs button').forEach(function (tabButton) { tabButton.classList.remove('active'); });
      document.getElementById(id).classList.add('active');
      button.classList.add('active');
      window.scrollTo(0, 0);
    };

    const openDashboard = function () {
      const entered = window.prompt('Enter dashboard passcode:');
      if (entered === '002626') {
        sessionStorage.setItem('15m-dashboard-unlocked', 'yes');
        activate('dashboard', dashboardButton);
      } else if (entered !== null) {
        window.alert('Incorrect passcode.');
      }
    };

    dashboardButton.addEventListener('click', function (event) {
      if (sessionStorage.getItem('15m-dashboard-unlocked') === 'yes') return;
      event.preventDefault();
      event.stopImmediatePropagation();
      openDashboard();
    }, true);

    if (sessionStorage.getItem('15m-dashboard-unlocked') !== 'yes' && dashboard.classList.contains('active') && invoiceButton) {
      activate('invoices', invoiceButton);
    }
  }

  function readDashboard() {
    try { return JSON.parse(localStorage.getItem('15m-owner-report') || '{}'); }
    catch (_) { return {}; }
  }

  async function upload() {
    if (!syncReady) return;
    status('Saving to cloud...');
    const payload = readDashboard();
    const result = await client.from(TABLE).upsert({ id: ROW_ID, payload: payload }, { onConflict: 'id' });
    status(result.error ? 'Cloud sync needs attention' : 'Cloud synced');
    if (result.error) console.error('15M cloud sync:', result.error);
  }

  function scheduleUpload() { clearTimeout(timer); timer = setTimeout(upload, 450); }

  async function loadCloud() {
    status('Loading secure records...');
    const result = await client.from(TABLE).select('payload').eq('id', ROW_ID).maybeSingle();
    if (result.error) { status('Cloud sync needs attention'); console.error('15M cloud load:', result.error); return; }
    if (result.data && result.data.payload && Object.keys(result.data.payload).length) {
      data = result.data.payload;
      localStorage.setItem('15m-owner-report', JSON.stringify(data));
      if (typeof render === 'function') render();
    } else {
      syncReady = true;
      await upload();
      return;
    }
    syncReady = true;
    status('Cloud synced');
  }

  async function begin() {
    addStyles();
    applyBrandLogo();
    protectDashboard();
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.onload = async function () {
      client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      const session = await client.auth.getSession();
      if (!session.data.session) { showSignIn(); return; }
      hideSignIn();
      const originalSave = typeof save === 'function' ? save : null;
      if (originalSave) {
        save = function () { originalSave(); scheduleUpload(); };
      }
      await loadCloud();
      client.auth.onAuthStateChange(function (_event, nextSession) {
        if (!nextSession) { syncReady = false; showSignIn('Please sign in again to continue syncing.'); }
      });
    };
    script.onerror = function () { status('Cloud sync library could not load'); };
    document.head.appendChild(script);
  }

  begin();
}());
