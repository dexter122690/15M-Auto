/* 15M Autocare cloud sync and owner-approved sign-in. */
(function () {
  const SUPABASE_URL = 'https://nverrabdiqvwkevufbag.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_g7F7q0quFV3t84VOilAayg_uv3FtKgv';
  const TABLE = 'dashboard_state';
  const ROW_ID = 1;
  const OWNER_EMAIL = 'dexterbsanagustin@gmail.com';
  const BRANCH_ACCESS = {
    '15mbranch2@gmail.com': { id: 'sta-rosa', password: 'carpaint77' },
    '15msto.tomas@gmail.com': { id: '15m-sto-tomas', password: 'carpaint88' }
  };
  const BRANCH_STORE_KEY = '15m-branch-store';
  const LEGACY_DATA_KEY = '15m-owner-report';
  let client, currentSession, syncReady = false, timer, branchStore = null;

  // The main app expects this legacy key to contain only one branch's plain records.
  // Move an older multi-branch value out of that key before the next page refresh.
  function repairLocalBranchStorage() {
    try {
      const saved = JSON.parse(localStorage.getItem(LEGACY_DATA_KEY) || 'null');
      if (!saved || !saved.__15mMultiBranch || !saved.branchData) return false;
      const selected = saved.selectedBranchId && saved.selectedBranchId !== 'all' ? saved.selectedBranchId : 'sta-rosa';
      localStorage.setItem(BRANCH_STORE_KEY, JSON.stringify(saved));
      localStorage.setItem(LEGACY_DATA_KEY, JSON.stringify(saved.branchData[selected] || {}));
      return true;
    } catch (_) { return false; }
  }
  const repairedLocalBranchStorage = repairLocalBranchStorage();

  function addStyles() {
    if (document.getElementById('supabase-sync-style')) return;
    const style = document.createElement('style');
    style.id = 'supabase-sync-style';
    style.textContent = `
      .cloud-overlay{position:fixed;inset:0;z-index:99999;display:grid;place-items:center;background:rgba(0,0,0,.72);padding:20px;font-family:Arial,sans-serif}
      .cloud-card{width:min(440px,100%);background:#fffaf7;border:2px solid #ff5a16;border-radius:18px;padding:28px;color:#24130c;box-shadow:0 20px 60px rgba(0,0,0,.45)}
      .cloud-card h2{margin:0 0 8px;color:#e64a0c}.cloud-card p{line-height:1.45}.cloud-card input{box-sizing:border-box;width:100%;padding:12px;border:1px solid #d9c9bf;border-radius:9px;margin:6px 0;font-size:15px}.cloud-card label{font-size:12px;font-weight:700;display:block;margin-top:9px}.cloud-card button{width:100%;padding:12px;border:0;border-radius:9px;background:#ff5a16;color:#fff;font-weight:700;cursor:pointer;margin-top:9px}.cloud-card .cloud-secondary{background:transparent;color:#5c3522;border:1px solid #cbb7ab}.cloud-card small{display:block;margin-top:12px;color:#765;line-height:1.35}.cloud-card hr{border:0;border-top:1px solid #e8d9d1;margin:18px 0}.cloud-card .cloud-user{background:#fff1e8;padding:10px;border-radius:8px;margin:8px 0}.cloud-card .cloud-row{display:flex;gap:8px;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid #eadbd2}.cloud-card .cloud-row button{width:auto;padding:8px 11px;margin:0}.cloud-card .cloud-row .decline{background:#6d4c41}
      #cloudSignIn{padding:0;background:#0d0f12}#cloudSignIn .cloud-card{width:100%;height:100%;max-width:none;border:0;border-radius:0;padding:0;display:grid;grid-template-columns:1.15fr .85fr;background:#18191d;color:#fff;box-shadow:none}#cloudSignIn .cloud-brand{position:relative;overflow:hidden;padding:clamp(36px,7vw,96px);display:flex;flex-direction:column;justify-content:center;background:radial-gradient(circle at 25% 20%,#482111 0,transparent 31%),linear-gradient(135deg,#080a0c,#171114)}#cloudSignIn .cloud-brand:after{content:'';position:absolute;width:430px;height:430px;border:42px solid #ff5a16;border-radius:50%;right:-190px;bottom:-230px;opacity:.25}#cloudSignIn .cloud-brand img{width:92px;height:92px;object-fit:contain;margin-bottom:42px;z-index:1}#cloudSignIn .cloud-brand h1{font-size:clamp(38px,5vw,70px);line-height:1.06;margin:0;max-width:700px;z-index:1}#cloudSignIn .cloud-brand h1 span{color:#ff5a16}#cloudSignIn .cloud-brand p{font-size:17px;color:#ddd;max-width:500px;z-index:1}#cloudSignIn .cloud-form{display:flex;align-items:center;justify-content:center;padding:40px;background:#1c1d21}#cloudSignIn .cloud-form-inner{width:min(420px,100%)}#cloudSignIn .cloud-form h2{color:#fff;font-size:28px;margin:0 0 8px}#cloudSignIn .cloud-form p{color:#b9b9bd;margin:0 0 22px}#cloudSignIn .cloud-form label{color:#ddd;font-size:13px}#cloudSignIn .cloud-form input{background:#25262b;border-color:#56575e;color:#fff;border-radius:12px;padding:15px}#cloudSignIn .cloud-form button{border-radius:12px;padding:15px;background:#ff5a16;font-size:16px}#cloudSignIn .cloud-form .cloud-secondary{color:#fff;border-color:#55565c;background:transparent}#cloudSignIn .cloud-form small{color:#bdbdc2}@media(max-width:760px){#cloudSignIn .cloud-card{display:block;overflow:auto}#cloudSignIn .cloud-brand{padding:34px 28px;min-height:205px}#cloudSignIn .cloud-brand img{width:62px;height:62px;margin-bottom:18px}#cloudSignIn .cloud-brand h1{font-size:34px}#cloudSignIn .cloud-brand p{font-size:14px}#cloudSignIn .cloud-form{padding:34px 24px;align-items:flex-start}}
      #cloudStatus{position:fixed;right:14px;bottom:14px;z-index:9990;background:#151515;color:#fff;padding:8px 11px;border-radius:999px;font:12px Arial,sans-serif;box-shadow:0 3px 12px rgba(0,0,0,.25);cursor:pointer}
      #branchControl{position:relative;z-index:2;display:flex;gap:7px;align-items:center;width:fit-content;max-width:calc(100% - 32px);margin:8px 16px 2px auto;background:#fffaf7;border:1px solid #e7cabd;border-radius:10px;padding:8px 10px;box-shadow:0 3px 12px rgba(0,0,0,.14);font:12px Arial,sans-serif;color:#4d291b}#branchControl strong{white-space:nowrap}#branchControl select{max-width:170px;padding:6px;border:1px solid #d8bfb3;border-radius:6px;background:#fff}#branchControl button{padding:6px 8px;border:0;border-radius:6px;background:#ff5a16;color:#fff;font-weight:700;cursor:pointer}@media(max-width:680px){#branchControl{width:auto;margin:7px 12px;justify-content:flex-start;flex-wrap:wrap}#branchControl select{flex:1;min-width:145px;max-width:none}}
    `;
    document.head.appendChild(style);
  }

  function isOwner() { return !!(currentSession && currentSession.user && String(currentSession.user.email).toLowerCase() === OWNER_EMAIL); }
  function assignedBranch() { const email = currentSession && currentSession.user && currentSession.user.email ? String(currentSession.user.email).toLowerCase() : ''; return BRANCH_ACCESS[email] || null; }
  function canOpenBranch(id, suppliedPassword) {
    if (isOwner()) return true;
    const assignment = assignedBranch();
    if (!assignment || assignment.id !== id) { window.alert('Your account is assigned to a different branch.'); return false; }
    const unlockKey = '15m-branch-unlocked-' + (currentSession && currentSession.user ? currentSession.user.id : '') + '-' + id;
    if (sessionStorage.getItem(unlockKey) === 'yes') return true;
    const entered = suppliedPassword === undefined ? window.prompt('Enter the access password for this branch:') : suppliedPassword;
    if (entered === assignment.password) { sessionStorage.setItem(unlockKey, 'yes'); return true; }
    if (entered !== null) window.alert('Incorrect branch password.');
    return false;
  }
  function removeModal(id) { const el = document.getElementById(id); if (el) el.remove(); }
  function status(message) { let el = document.getElementById('cloudStatus'); if (!el) { el = document.createElement('div'); el.id = 'cloudStatus'; document.body.appendChild(el); } el.textContent = message; el.onclick = function () { isOwner() ? showApprovals() : showSignIn(); }; }

  function showSignIn(message) {
    addStyles(); removeModal('cloudPending'); removeModal('cloudApprovals');
    let modal = document.getElementById('cloudSignIn');
    if (!modal) {
      modal = document.createElement('div'); modal.id = 'cloudSignIn'; modal.className = 'cloud-overlay';
      modal.innerHTML = `<div class="cloud-card"><section class="cloud-brand"><img src="new%20logo%2015m.png" alt="15M Autocare"><h1>Manage your branch.<br><span>Protect your records.</span></h1><p>Secure invoicing, sales, expenses, cash control, and payroll for 15M Autocare Services.</p></section><section class="cloud-form"><div class="cloud-form-inner"><h2>Sign in to 15M</h2><p>Use your approved business account to continue.</p><label>Email address</label><input id="cloudEmail" type="email" placeholder="you@example.com" autocomplete="email"><label>Password</label><input id="cloudPassword" type="password" placeholder="At least 6 characters" autocomplete="current-password"><button id="cloudSignInButton" type="button">Sign in</button><button id="cloudSignUpButton" class="cloud-secondary" type="button">Create a new account</button><hr><button id="cloudLinkButton" class="cloud-secondary" type="button">Email me a sign-in link instead</button><small id="cloudMessage"></small></div></section></div>`;
      document.body.appendChild(modal);
      const getValues = function () { return { email: document.getElementById('cloudEmail').value.trim(), password: document.getElementById('cloudPassword').value }; };
      const note = function (text) { document.getElementById('cloudMessage').textContent = text; };
      document.getElementById('cloudSignInButton').onclick = async function () { const v = getValues(); if (!v.email || !v.password) return note('Enter your email and password.'); note('Signing in...'); const r = await client.auth.signInWithPassword(v); note(r.error ? r.error.message : 'Signed in. Checking access...'); };
      document.getElementById('cloudSignUpButton').onclick = async function () { const v = getValues(); if (!v.email || v.password.length < 6) return note('Enter your email and a password with at least 6 characters.'); note('Creating your account...'); const r = await client.auth.signUp({ email: v.email, password: v.password, options: { emailRedirectTo: location.origin + location.pathname } }); note(r.error ? r.error.message : 'Account created. Check your email to confirm it, then wait for owner approval.'); };
      document.getElementById('cloudLinkButton').onclick = async function () { const v = getValues(); if (!v.email) return note('Enter your email address first.'); note('Sending your sign-in link...'); const r = await client.auth.signInWithOtp({ email: v.email, options: { emailRedirectTo: location.origin + location.pathname } }); note(r.error ? r.error.message : 'Check your email and open the sign-in link.'); };
    }
    document.getElementById('cloudMessage').textContent = message || 'Only approved staff can use the shared records.';
  }

  function showPending(approval) {
    addStyles(); removeModal('cloudSignIn'); removeModal('cloudApprovals');
    let modal = document.getElementById('cloudPending');
    if (!modal) { modal = document.createElement('div'); modal.id = 'cloudPending'; modal.className = 'cloud-overlay'; document.body.appendChild(modal); }
    const rejected = approval && approval.status === 'rejected';
    modal.innerHTML = `<div class="cloud-card"><h2>${rejected ? 'Access not approved' : 'Approval needed'}</h2><p>${rejected ? 'This account was not approved. Please contact the 15M owner if you believe this is a mistake.' : 'Your account is ready, but the owner must approve it before you can view the business records.'}</p><small>Signed in as ${currentSession && currentSession.user.email ? currentSession.user.email : ''}</small><button id="cloudSignOut" class="cloud-secondary" type="button">Sign out</button></div>`;
    document.getElementById('cloudSignOut').onclick = function () { client.auth.signOut(); removeModal('cloudPending'); showSignIn('You have signed out.'); };
  }

  function chooseOpeningBranch() {
    return new Promise(function (resolve) {
      addStyles(); removeModal('cloudSignIn'); removeModal('cloudPending'); removeModal('cloudApprovals');
      const assignment = assignedBranch();
      const choices = isOwner() ? [{ id: 'sta-rosa', name: '15M Sta. Rosa' }, { id: '15m-sto-tomas', name: '15M Sto. Tomas' }, { id: 'all', name: 'All branches (owner)' }] : (assignment ? [{ id: assignment.id, name: assignment.id === 'sta-rosa' ? '15M Sta. Rosa' : '15M Sto. Tomas' }] : []);
      let modal = document.getElementById('branchGate');
      if (!modal) { modal = document.createElement('div'); modal.id = 'branchGate'; modal.className = 'cloud-overlay'; document.body.appendChild(modal); }
      modal.innerHTML = '<div class="cloud-card"><h2>Open a branch</h2><p>Select the 15M branch you need to use.</p><label>Branch</label><select id="openingBranch">' + choices.map(function (branch) { return '<option value="' + branch.id + '">' + branch.name + '</option>'; }).join('') + '</select>' + (isOwner() ? '' : '<label>Branch password</label><input id="openingBranchPassword" type="password" autocomplete="current-password" placeholder="Enter branch password">') + '<button id="openBranchButton" type="button">Open branch</button><small id="branchGateMessage"></small></div>';
      document.getElementById('openBranchButton').onclick = function () { const id = document.getElementById('openingBranch').value; const password = document.getElementById('openingBranchPassword'); if (!choices.length) { document.getElementById('branchGateMessage').textContent = 'This account has no branch assigned. Contact the owner.'; return; } if (!canOpenBranch(id, password ? password.value : undefined)) { document.getElementById('branchGateMessage').textContent = 'Enter the correct branch password.'; return; } modal.remove(); resolve(id); };
    });
  }

  async function showApprovals() {
    if (!isOwner()) return showSignIn('Only the owner can review account requests.');
    addStyles(); removeModal('cloudSignIn'); removeModal('cloudPending');
    let modal = document.getElementById('cloudApprovals');
    if (!modal) { modal = document.createElement('div'); modal.id = 'cloudApprovals'; modal.className = 'cloud-overlay'; document.body.appendChild(modal); }
    modal.innerHTML = `<div class="cloud-card"><h2>Account approvals</h2><p>Loading new account requests...</p></div>`;
    const result = await client.from('user_approvals').select('user_id,email,status,created_at').eq('status','pending').order('created_at',{ascending:true});
    const rows = result.data || [];
    modal.innerHTML = `<div class="cloud-card"><h2>Account approvals</h2><p>${rows.length ? 'Choose who can use the shared 15M records.' : 'There are no pending account requests.'}</p><div id="approvalRows">${rows.map(function (r) { return `<div class="cloud-row"><span><b>${r.email}</b><br><small>Requested ${new Date(r.created_at).toLocaleDateString()}</small></span><span><button data-approve="${r.user_id}">Approve</button><button class="decline" data-reject="${r.user_id}">Decline</button></span></div>`; }).join('')}</div><button id="closeApprovals" class="cloud-secondary" type="button">Close</button><small id="approvalMessage"></small></div>`;
    document.getElementById('closeApprovals').onclick = function () { removeModal('cloudApprovals'); };
    modal.querySelectorAll('[data-approve],[data-reject]').forEach(function (button) { button.onclick = async function () { const statusValue = this.dataset.approve ? 'approved' : 'rejected'; const id = this.dataset.approve || this.dataset.reject; const r = await client.from('user_approvals').update({ status: statusValue, reviewed_at: new Date().toISOString(), reviewed_by: currentSession.user.id }).eq('user_id', id); document.getElementById('approvalMessage').textContent = r.error ? r.error.message : 'Account ' + statusValue + '.'; if (!r.error) showApprovals(); }; });
  }

  function applyBrandLogo() { const logoPath = 'new%20logo%2015m.png'; const setLogo = function () { document.querySelectorAll('.logo, img[alt="15M Autocare logo"], img[src="15m-autocare-logo.png"]').forEach(function (image) { if (image.getAttribute('src') !== logoPath) image.src = logoPath; }); }; setLogo(); new MutationObserver(setLogo).observe(document.body, { childList: true, subtree: true }); }
  function protectDashboard() { const dashboardButton = Array.from(document.querySelectorAll('.tabs button')).find(function (button) { return button.textContent.trim() === 'Dashboard'; }); const invoiceButton = Array.from(document.querySelectorAll('.tabs button')).find(function (button) { return button.textContent.trim() === 'Invoice Making'; }); const dashboard = document.getElementById('dashboard'); if (!dashboardButton || !dashboard) return; const activate = function (id, button) { document.querySelectorAll('.tab').forEach(function (section) { section.classList.remove('active'); }); document.querySelectorAll('.tabs button').forEach(function (tabButton) { tabButton.classList.remove('active'); }); document.getElementById(id).classList.add('active'); button.classList.add('active'); window.scrollTo(0, 0); }; const openDashboard = function () { const entered = window.prompt('Enter dashboard passcode:'); if (entered === '002626') { sessionStorage.setItem('15m-dashboard-unlocked', 'yes'); activate('dashboard', dashboardButton); } else if (entered !== null) window.alert('Incorrect passcode.'); }; dashboardButton.addEventListener('click', function (event) { if (sessionStorage.getItem('15m-dashboard-unlocked') === 'yes') return; event.preventDefault(); event.stopImmediatePropagation(); openDashboard(); }, true); if (sessionStorage.getItem('15m-dashboard-unlocked') !== 'yes' && dashboard.classList.contains('active') && invoiceButton) activate('invoices', invoiceButton); }
  function legacyBranchStore(payload) {
    if (payload && payload.__15mMultiBranch && payload.branchData) return payload;
    return { __15mMultiBranch: true, selectedBranchId: 'sta-rosa', branches: [{ id: 'sta-rosa', name: '15M Sta. Rosa' }], branchData: { 'sta-rosa': payload && Object.keys(payload).length ? payload : (typeof data !== 'undefined' ? data : {}) } };
  }
  function mergedBranchData() {
    const records = Object.keys(branchStore.branchData || {}).map(function (id) { return branchStore.branchData[id] || {}; });
    const merged = {};
    records.forEach(function (record) { Object.keys(record).forEach(function (key) { if (Array.isArray(record[key])) merged[key] = (merged[key] || []).concat(record[key]); else if (merged[key] === undefined) merged[key] = record[key]; }); });
    return merged;
  }
  function emptyBranchData() { return { invoices: [], expenses: [], feedback: [], pettyCash: [], cibManual: [], employees: [], payroll: [], imports: {} }; }
  function removeCopiedBranchRecords() {
    if (!branchStore || !branchStore.branchData || !branchStore.branchData['sta-rosa']) return false;
    const staRosa = JSON.stringify(branchStore.branchData['sta-rosa']);
    let changed = false;
    branchStore.branches.forEach(function (branch) {
      if (branch.id !== 'sta-rosa' && JSON.stringify(branchStore.branchData[branch.id] || {}) === staRosa) { branchStore.branchData[branch.id] = emptyBranchData(); changed = true; }
    });
    return changed;
  }
  function saveBranchStore() { if (!branchStore) return; if (branchStore.selectedBranchId !== 'all') branchStore.branchData[branchStore.selectedBranchId] = data; localStorage.setItem(BRANCH_STORE_KEY, JSON.stringify(branchStore)); localStorage.setItem(LEGACY_DATA_KEY, JSON.stringify(data)); }
  function activateBranch(id, redraw) {
    if (!branchStore) return false;
    if (!canOpenBranch(id)) return false;
    branchStore.selectedBranchId = id;
    data = id === 'all' ? mergedBranchData() : (branchStore.branchData[id] || (branchStore.branchData[id] = {}));
    saveBranchStore();
    if (redraw) { const finish = syncReady ? upload() : Promise.resolve(); finish.finally(function () { location.reload(); }); return true; }
    renderBranchControl();
    return true;
  }
  function renderBranchControl() {
    if (!branchStore) return;
    let box = document.getElementById('branchControl');
    if (!box) { box = document.createElement('div'); box.id = 'branchControl'; const tabs = document.querySelector('.tabs'); if (tabs && tabs.parentNode) tabs.parentNode.insertBefore(box, tabs.nextSibling); else document.body.appendChild(box); }
    const selected = branchStore.selectedBranchId || 'sta-rosa';
    const availableBranches = isOwner() ? branchStore.branches : branchStore.branches.filter(function (branch) { const assignment = assignedBranch(); return assignment && assignment.id === branch.id; });
    box.innerHTML = '<strong>Branch</strong><select id="branchSelect">' + availableBranches.map(function (branch) { return '<option value="' + branch.id + '"' + (branch.id === selected ? ' selected' : '') + '>' + branch.name + '</option>'; }).join('') + (isOwner() ? '<option value="all"' + (selected === 'all' ? ' selected' : '') + '>All branches (owner)</option>' : '') + '</select>' + (isOwner() ? '<button id="addBranchButton" type="button">+ Branch</button>' : '');
    document.getElementById('branchSelect').onchange = function () { activateBranch(this.value, true); };
    const addButton = document.getElementById('addBranchButton');
    if (addButton) addButton.onclick = function () { const name = window.prompt('New branch name (example: 15M Sto. Tomas):'); if (!name || !name.trim()) return; const base = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'branch'; let id = base, n = 2; while (branchStore.branches.some(function (branch) { return branch.id === id; })) id = base + '-' + n++; branchStore.branches.push({ id: id, name: name.trim() }); branchStore.branchData[id] = emptyBranchData(); activateBranch(id, true); };
  }
  function readDashboard() { try { return branchStore || JSON.parse(localStorage.getItem(BRANCH_STORE_KEY) || '{}'); } catch (_) { return branchStore || {}; } }
  async function upload() { if (!syncReady) return; status('Saving to cloud...'); const result = await client.from(TABLE).upsert({ id: ROW_ID, payload: readDashboard() }, { onConflict: 'id' }); status(result.error ? 'Cloud sync needs attention' : isOwner() ? 'Cloud synced â€” tap for account approvals' : 'Cloud synced'); if (result.error) console.error('15M cloud sync:', result.error); }
  function scheduleUpload() { clearTimeout(timer); timer = setTimeout(upload, 450); }
  async function loadCloud(openingBranch) { status('Loading secure records...'); const result = await client.from(TABLE).select('payload').eq('id', ROW_ID).maybeSingle(); if (result.error) { status('Cloud sync needs attention'); console.error('15M cloud load:', result.error); return; } branchStore = legacyBranchStore(result.data && result.data.payload); const removedCopies = removeCopiedBranchRecords(); if (!openingBranch || !activateBranch(openingBranch, false)) { status('Branch access is not available for this account.'); return; } if (typeof render === 'function') { try { render(); } catch (error) { console.warn('Cloud records loaded, but this screen needs a display refresh:', error); } } renderBranchControl(); syncReady = true; if (!result.data || !result.data.payload || !result.data.payload.__15mMultiBranch || removedCopies) await upload(); status(isOwner() ? 'Cloud synced â€” tap for account approvals' : 'Cloud synced'); }
  async function acceptSession(session) { currentSession = session; if (!session) { syncReady = false; showSignIn('Sign in to use the shared records.'); return; } const approval = await client.from('user_approvals').select('status').eq('user_id', session.user.id).maybeSingle(); if (approval.error || !approval.data || approval.data.status !== 'approved') { showPending(approval.data); return; } const openingBranch = await chooseOpeningBranch(); const originalSave = typeof save === 'function' ? save : null; if (originalSave && !window.__15mCloudSaveWrapped) { window.__15mCloudSaveWrapped = true; save = function () { originalSave(); saveBranchStore(); scheduleUpload(); }; } await loadCloud(openingBranch); }
  async function begin() { addStyles(); applyBrandLogo(); protectDashboard(); const script = document.createElement('script'); script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'; script.onload = async function () { client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY); const session = await client.auth.getSession(); await acceptSession(session.data.session); client.auth.onAuthStateChange(function (_event, nextSession) { setTimeout(function () { acceptSession(nextSession); }, 0); }); }; script.onerror = function () { status('Cloud sync library could not load'); }; document.head.appendChild(script); }
  begin();
  if (repairedLocalBranchStorage) setTimeout(function () { location.reload(); }, 50);
}());

