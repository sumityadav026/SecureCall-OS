// =================== DATA ===================
const USERS = {
  root:  { pass: 'admin123', role: 'admin',   name: 'Root Admin',    mfa: true  },
  dev1:  { pass: 'dev123',   role: 'dev',     name: 'Dev User 1',    mfa: true  },
  user1: { pass: 'pass123',  role: 'user',    name: 'Standard User', mfa: false },
  audit: { pass: 'audit123', role: 'auditor', name: 'Auditor',       mfa: false },
};

const SYSCALLS = [
  { id: 0,  name: 'read',      cat: 'File I/O',  desc: 'Read data from a file descriptor', perm: 'all',   params: ['fd','buf','count'], num: 'SYS_0' },
  { id: 1,  name: 'write',     cat: 'File I/O',  desc: 'Write data to a file descriptor',  perm: 'all',   params: ['fd','buf','count'], num: 'SYS_1' },
  { id: 2,  name: 'open',      cat: 'File I/O',  desc: 'Open or create a file',            perm: 'all',   params: ['pathname','flags'], num: 'SYS_2' },
  { id: 3,  name: 'close',     cat: 'File I/O',  desc: 'Close an open file descriptor',    perm: 'all',   params: ['fd'],              num: 'SYS_3' },
  { id: 57, name: 'fork',      cat: 'Process',   desc: 'Create a child process',           perm: 'dev',   params: [],                  num: 'SYS_57' },
  { id: 59, name: 'execve',    cat: 'Process',   desc: 'Execute a program',                perm: 'dev',   params: ['filename','argv','envp'], num: 'SYS_59' },
  { id: 60, name: 'exit',      cat: 'Process',   desc: 'Terminate calling process',        perm: 'all',   params: ['status'],          num: 'SYS_60' },
  { id: 62, name: 'kill',      cat: 'Process',   desc: 'Send signal to a process',         perm: 'admin', params: ['pid','sig'],        num: 'SYS_62' },
  { id: 9,  name: 'mmap',      cat: 'Memory',    desc: 'Map files/devices into memory',    perm: 'dev',   params: ['addr','length','prot'], num: 'SYS_9' },
  { id: 11, name: 'munmap',    cat: 'Memory',    desc: 'Unmap files/devices from memory',  perm: 'dev',   params: ['addr','length'],   num: 'SYS_11' },
  { id: 41, name: 'socket',    cat: 'Network',   desc: 'Create a network socket endpoint', perm: 'dev',   params: ['domain','type','protocol'], num: 'SYS_41' },
  { id: 105, name: 'setuid',   cat: 'Security',  desc: 'Set user identity',                perm: 'admin', params: ['uid'],              num: 'SYS_105' },
  { id: 106, name: 'getuid',   cat: 'Security',  desc: 'Get user identity',                perm: 'all',   params: [],                  num: 'SYS_106' },
  { id: 161, name: 'chroot',   cat: 'Security',  desc: 'Change root directory',            perm: 'admin', params: ['path'],             num: 'SYS_161' },
  { id: 16, name: 'ioctl',     cat: 'Device',    desc: 'Control device parameters',        perm: 'admin', params: ['fd','request'],     num: 'SYS_16' },
  { id: 39, name: 'getpid',    cat: 'Process',   desc: 'Get process identifier',           perm: 'all',   params: [],                  num: 'SYS_39' },
];

const ROLE_PERMS = { admin: ['all','dev','admin'], dev: ['all','dev'], user: ['all'], auditor: ['all'] };

let currentUser = null, currentRole = 'user', selectedRole = 'user';
let logs = [], logFilter = 'all', activeSyscall = null;
let sessionId = 'SC-' + Math.floor(Math.random()*9000+1000);


// =================== LOGIN ===================
// =================== TOAST SYSTEM ===================
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerText = message;

  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function selectRole(el) {
  document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('selected'));
  el.classList.add('selected');
  selectedRole = el.dataset.role;
  const needMfa = (selectedRole === 'admin' || selectedRole === 'dev');
  document.getElementById('mfa-box').style.display = needMfa ? 'block' : 'none';
}

function mfaNext(el, nextId) {
  el.value = el.value.replace(/[^0-9]/g, '');
  if (el.value && nextId) document.getElementById(nextId).focus();
}

function doLogin() {
  const user = document.getElementById('login-user').value.trim();
  const pass = document.getElementById('login-pass').value;
  const err = document.getElementById('login-error');
  err.style.display = 'none';

  if (!USERS[user]) { showErr('Unknown username.'); return; }
  if (USERS[user].pass !== pass) { showErr('Incorrect password.'); return; }
  if (USERS[user].role !== selectedRole) {
    showErr('Selected role does not match user role');
  return;
  }
  document.querySelectorAll('.role-btn').forEach(b => {
  b.classList.toggle('selected', b.dataset.role === selectedRole);
});
  const needMfa = (selectedRole === 'admin' || selectedRole === 'dev');
  if (needMfa) {
    const code = ['d1','d2','d3','d4','d5','d6'].map(id => document.getElementById(id).value).join('');
    if (code.length < 6) { showErr('Please enter all 6 MFA digits.'); return; }
  }

  currentUser = user; currentRole = USERS[user].role;
  addLog(user, 'login', '', 1, 'success', 0);
  initApp();
  showToast(`Welcome ${USERS[currentUser].name}`, 'success');
}

function showErr(msg) {
  const e = document.getElementById('login-error');
  e.textContent = msg; e.style.display = 'block';
}

function doLogout() {
  addLog(currentUser, 'logout', '', 1, 'success', 0);

  // ✅ Stop session timer
  if (window._sessionTimer) {
    clearInterval(window._sessionTimer);
    window._sessionTimer = null;
  }

  document.getElementById('login-screen').classList.add('active');
  document.getElementById('app-screen').classList.remove('active');
  document.getElementById('login-user').value = '';
  document.getElementById('login-pass').value = '';
  document.getElementById('login-error').style.display = 'none';
  ['d1','d2','d3','d4','d5','d6'].forEach(id => document.getElementById(id).value = '');
}

// =================== SESSION TIMER ===================
function startSessionTimer(durationMinutes = 30) {
  // Prevent multiple timers
  if (window._sessionTimer) {
    clearInterval(window._sessionTimer);
  }

  let remaining = durationMinutes * 60;
  const timerEl = document.getElementById('session-timer');

  function updateUI() {
    if (!timerEl) return;

    const mins = String(Math.floor(remaining / 60)).padStart(2, '0');
    const secs = String(remaining % 60).padStart(2, '0');
    timerEl.textContent = `⏱ ${mins}:${secs}`;

    if (remaining <= 300) {
      timerEl.style.color = '#ef4444';
      timerEl.style.animation = 'pulse 1s infinite';
    } else {
      timerEl.style.color = '#22c55e';
      timerEl.style.animation = 'none';
  }
  }

  updateUI();

  const interval = setInterval(() => {
    remaining--;

    updateUI();

    if (remaining <= 0) {
      clearInterval(interval);
      window._sessionTimer = null;

      showToast('Session expired — logged out for security', 'warning');
      doLogout(); // integrate with your system
    }
  }, 1000);

  window._sessionTimer = interval;
}

// =================== APP INIT ===================
function initApp() {
  document.getElementById('login-screen').classList.remove('active');
  document.getElementById('app-screen').classList.add('active');

  document.getElementById('top-name').textContent = USERS[currentUser].name;
  document.getElementById('top-avatar').textContent = currentUser[0].toUpperCase();
  const roleEl = document.getElementById('top-role');
  roleEl.textContent = currentRole;
  roleEl.className = 'user-role-badge role-' + (
  currentRole === 'admin' ? 'admin' :
  currentRole === 'dev' ? 'dev' :
  currentRole === 'auditor' ? 'auditor' :
  'user'
);
  document.getElementById('term-prompt').textContent = currentUser + '@securecall:~$';
  document.getElementById('session-id').textContent = sessionId;
  document.getElementById('role-notice').textContent = '🔑 Role: ' + currentRole.toUpperCase();

  // Users tab visibility
  if (currentRole !== 'admin') {
    document.getElementById('users-locked-msg').style.display = 'block';
    document.getElementById('users-content').style.display = 'none';
  } else {
    document.getElementById('users-locked-msg').style.display = 'none';
    document.getElementById('users-content').style.display = 'block';
  }

  buildSyscallGrid();
  buildUsersTable();
  buildPermMatrix();
  buildActivityChart();
  renderLogs();
  startLiveFeed();
  termPrint({type:'ok', text:'Session authenticated — Welcome, ' + USERS[currentUser].name + ' [' + currentRole.toUpperCase() + ']'});
  termPrint({type:'info', text:'Session ID: ' + sessionId + ' | ' + new Date().toISOString()});
  startSessionTimer(30);
}

//=================== SYSCALL GRID ===================
function buildSyscallGrid() {
  const grid = document.getElementById('syscall-grid');
  const userPerms = ROLE_PERMS[currentRole];
  grid.innerHTML = SYSCALLS.map(sc => {
    const canUse = userPerms.includes(sc.perm);
    return `<div class="syscall-card ${canUse?'':'locked'}" onclick="${canUse?'openModal('+sc.id+')':'showDenied()'}">
      ${!canUse?'<div class="lock-icon">🔒</div>':''}
      <div class="syscall-num">${sc.num} · ${sc.cat}</div>
      <div class="syscall-name">${sc.name}()</div>
      <div class="syscall-desc">${sc.desc}</div>
      <div class="syscall-meta">
        <span class="syscall-perm perm-${sc.perm==='all'?'all':sc.perm==='dev'?'dev':'admin'}">${sc.perm==='all'?'ALL ROLES':sc.perm==='dev'?'DEV+':'ADMIN ONLY'}</span>
        <span class="syscall-count">${Math.floor(Math.random()*400+50)} calls</span>
      </div>
    </div>`;
  }).join('');
}

function showDenied() {
  termPrint({type:'err', text:'PERMISSION DENIED — Your role (' + currentRole + ') is not authorized for this syscall'});
  addLog(currentUser, 'syscall_attempt', 'locked', Math.floor(Math.random()*9000+1000), 'denied', -1);
}

// =================== MODAL ===================
function openModal(id) {
  activeSyscall = SYSCALLS.find(s => s.id === id);

  // ✅ 1. SHOW TERMINAL PREVIEW FIRST (instant feedback)
  const preview = activeSyscall.name + '(' + activeSyscall.params.map(p => getDefaultParam(p)).join(', ') + ')';
  termPrint({ type: 'prompt', text: preview });
  showToast(`${activeSyscall.name}() ready to execute`, 'info');

  // ✅ 2. PREPARE MODAL CONTENT
  document.getElementById('modal-title').textContent = activeSyscall.name + '()';
  document.getElementById('modal-sub').textContent = activeSyscall.desc + ' · Category: ' + activeSyscall.cat;

  let paramsHtml = '';
  activeSyscall.params.forEach(p => {
    paramsHtml += `
      <div class="param-group">
        <div class="param-label">${p}</div>
        <input class="param-input" id="param-${p}" placeholder="Enter ${p}..." value="${getDefaultParam(p)}">
      </div>`;
  });
  document.getElementById('modal-params').innerHTML = paramsHtml;
  document.getElementById('modal-code').innerHTML = generateSyscallDoc(activeSyscall);
  
  // ✅ 3. CONTROL EXECUTION MODE
  const autoRun = false;
  if (autoRun) {
    runSyscall();
  } else {
    document.getElementById('syscall-modal').classList.add('open');
  }
}

function getDefaultParam(p) {
  const defs = { fd:'3', buf:'0x7fff', count:'1024', pathname:'/tmp/test.txt', flags:'O_RDONLY', status:'0', uid:'1000', path:'/jail', pid:'1234', sig:'SIGTERM', domain:'AF_INET', type:'SOCK_STREAM', protocol:'0', request:'TIOCGWINSZ', addr:'0x0', length:'4096', prot:'PROT_READ', filename:'/bin/ls', argv:'["ls","-la"]', envp:'[]' };
  return defs[p] || '';
}

function generateSyscallDoc(sc) {
  const args = sc.params.map(p => `<span class="code-val">${p}</span>`).join(', ');
  return `<span class="code-comment">// syscall signature</span>
<span class="code-key">long</span> <span class="code-val">${sc.name}</span>(${sc.params.map(p=>`<span class="code-key">void*</span> <span class="code-val">${p}</span>`).join(', ')});

<span class="code-comment">// kernel dispatch (x86-64)</span>
<span class="code-key">mov</span> <span class="code-val">rax</span>, ${sc.id}   <span class="code-comment">; syscall number</span>
<span class="code-key">syscall</span>           <span class="code-comment">; → kernel trap gate</span>
<span class="code-comment">// → SecureCall policy check → audit log → execute</span>`;
}

function closeModal() {
  document.getElementById('syscall-modal').classList.remove('open');
  activeSyscall = null;
}

function runSyscall() {
  if (!activeSyscall) return;

  const pid = Math.floor(Math.random()*9000+1000);
  const args = activeSyscall.params.map(p => document.getElementById('param-'+p)?.value || '').join(', ');
  const success = Math.random() > 0.15;
  const ret = success ? Math.floor(Math.random()*10) : -1;

  termPrint({ type: 'info-t', text: `→ Executing ${activeSyscall.name}()...` });

  setTimeout(() => {
    if (success) {
      termPrint({type:'ok', text:'✓ ' + activeSyscall.name + '() returned ' + ret + ' [PID ' + pid + '] — logged to audit trail'});
      showToast(`${activeSyscall.name}() executed — PID ${pid}`, 'success');
    } else {
      termPrint({type:'err', text:'✗ ' + activeSyscall.name + '() failed: EACCES(13) — Permission denied [PID ' + pid + ']'});
      showToast(`${activeSyscall.name}() denied`, 'error');
    }
  }, 300);

  addLog(currentUser, activeSyscall.name, args, pid, success ? 'success' : 'denied', ret);
  closeModal();
}

// =================== TERMINAL ===================
function termPrint(item) {
  const body = document.getElementById('terminal-body');
  const div = document.createElement('div');
  div.className = 'term-line';
  const ts = new Date().toLocaleTimeString();
  if (item.type === 'prompt') {
    div.innerHTML = `<span class="time-t" style="color:var(--text3);font-size:11px">[${ts}] </span><span class="prompt">${currentUser}@securecall:~$</span> <span class="cmd">${item.text}</span>`;
  } else if (item.type === 'ok') {
    div.innerHTML = `<span class="time-t" style="color:var(--text3);font-size:11px">[${ts}] </span><span class="ok">${item.text}</span>`;
  } else if (item.type === 'err') {
    div.innerHTML = `<span class="time-t" style="color:var(--text3);font-size:11px">[${ts}] </span><span class="err">${item.text}</span>`;
  } else if (item.type === 'warn') {
    div.innerHTML = `<span class="time-t" style="color:var(--text3);font-size:11px">[${ts}] </span><span class="warn">${item.text}</span>`;
  } else {
    div.innerHTML = `<span class="time-t" style="color:var(--text3);font-size:11px">[${ts}] </span><span class="info-t">${item.text}</span>`;
  }
  body.appendChild(div);
  body.scrollTop = body.scrollHeight;
}

function runTerminalCommand() {
  const inputEl = document.getElementById('term-input');
  const input = inputEl.value.trim();

  if (!input) return;

  termPrint({ type: 'prompt', text: input });

  const match = input.match(/^(\w+)\((.*)\)$/);

  if (!match) {
    termPrint({ type: 'err', text: 'Invalid command format' });
    showToast('Invalid syscall format', 'error');
    inputEl.value = '';
    return;
  }

  const name = match[1];
  const argsRaw = match[2];
  const args = argsRaw ? argsRaw.split(',').map(a => a.trim()) : [];

  const syscall = SYSCALLS.find(s => s.name === name);

  if (!syscall) {
    termPrint({ type: 'err', text: `Unknown syscall: ${name}` });
    showToast(`Unknown syscall: ${name}`, 'error');
    inputEl.value = '';
    return;
  }

  if (!ROLE_PERMS[currentRole].includes(syscall.perm)) {
    termPrint({ type: 'err', text: `${name}() denied — insufficient privileges` });
    showToast(`${name}() denied`, 'error');
    addLog(currentUser, name, args.join(', '), 0, 'denied', -1);
    inputEl.value = '';
    return;
  }

  // ✅ set active syscall
  activeSyscall = syscall;

  // ✅ simulate params
  syscall.params.forEach((p, i) => {
    const fakeInput = document.createElement('input');
    fakeInput.value = args[i] || '';
    fakeInput.id = 'param-' + p;
    document.body.appendChild(fakeInput);
  });

  runSyscall();

  // cleanup
  syscall.params.forEach(p => {
    const el = document.getElementById('param-' + p);
    if (el) el.remove();
  });

  inputEl.value = '';
}

// =================== LOGS ===================
function addLog(user, syscall, args, pid, status, ret) {
  logs.unshift({
    id: Date.now(),
    ts: new Date().toISOString().replace('T',' ').slice(0,19),
    user, syscall, args, pid, status, ret
  });
  if (logs.length > 200) logs.pop();
  renderLogs();
  updateStats();
}

function renderLogs() {
  const search = (document.getElementById('log-search')?.value || '').toLowerCase();
  let filtered = logs.filter(l => {
    if (logFilter !== 'all' && l.status !== logFilter) return false;
    if (search && !JSON.stringify(l).toLowerCase().includes(search)) return false;
    return true;
  });
  const tbody = document.getElementById('log-tbody');
  if (!tbody) return;
  tbody.innerHTML = filtered.slice(0, 80).map(l => `
    <tr>
      <td style="color:var(--text3)">#${l.id}</td>
      <td class="time-col">${l.ts}</td>
      <td class="user-col">${l.user}</td>
      <td class="syscall-col">${l.syscall}()</td>
      <td style="color:var(--text2);max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${l.args || '—'}</td>
      <td style="color:var(--text3)">${l.pid}</td>
      <td><span class="status-badge status-${l.status}">${l.status}</span></td>
      <td style="color:${l.ret<0?'var(--danger)':'var(--success)'}">${l.ret}</td>
    </tr>`).join('');
}

function filterLogs(f, btn) {
  logFilter = f;
  document.querySelectorAll('.log-filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderLogs();
}

function exportAuditLogCSV() {
  if (!logs || logs.length === 0) {
    showToast('No log entries to export', 'warning');
    return;
  }

  const headers = ['#', 'Timestamp', 'User', 'Syscall', 'Arguments', 'PID', 'Status', 'Return'];

  const rows = logs.map((entry, i) => [
    i + 1,
    entry.ts,
    entry.user,
    entry.syscall,
    `"${String(entry.args || '').replace(/"/g, '""')}"`,
    entry.pid,
    entry.status,
    entry.ret ?? 0
  ]);

  const csvContent = [headers, ...rows]
    .map(r => r.join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `securecall_audit_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();

  URL.revokeObjectURL(url);

  showToast('Audit log exported successfully', 'success');
}
// =================== USERS TABLE ===================
function buildUsersTable() {
  const tbody = document.getElementById('users-tbody');
  if (!tbody) return;

  const usersData = [
    { user:'root',  name:'Root Admin',    role:'admin',   ava:'RA', avaClass:'ava-red',    online:true,  login:'2025-03-15 14:00', perms:['read','write','execve','kill','setuid','chroot'] },
    { user:'dev1',  name:'Dev User 1',    role:'dev',     ava:'D1', avaClass:'ava-blue',   online:true,  login:'2025-03-15 13:22', perms:['read','write','open','fork','execve','mmap','socket'] },
    { user:'dev2',  name:'Dev User 2',    role:'dev',     ava:'D2', avaClass:'ava-blue',   online:false, login:'2025-03-14 18:05', perms:['read','write','open','fork','execve'] },
    { user:'user1', name:'Standard User', role:'user',    ava:'U1', avaClass:'ava-green',  online:true,  login:'2025-03-15 09:10', perms:['read','write','open','close','exit','getuid','getpid'] },
    { user:'audit', name:'Auditor',       role:'auditor', ava:'AU', avaClass:'ava-purple', online:true,  login:'2025-03-15 08:00', perms:['read','getuid','getpid'] },
  ];

  // Role badge helper
  function getRoleClass(role) {
    if (role === 'admin') return 'admin';
    if (role === 'dev') return 'dev';
    if (role === 'auditor') return 'auditor';
    return 'user';
  }

  // Render rows
  tbody.innerHTML = usersData.map(u => {
    const permsHTML = u.perms.map(p => 
      `<span class="mini-perm mp-g">${p}</span>`
    ).join('');

    return `
      <tr>
        <!-- USER INFO -->
        <td>
          <div class="user-info">
            <div class="user-ava ${u.avaClass}">${u.ava}</div>
            <div>
              <div style="font-weight:600;font-size:13px">${u.name}</div>
              <div style="font-size:11px;color:var(--text3);font-family:var(--font-mono)">
                ${u.user}
              </div>
            </div>
          </div>
        </td>

        <!-- ROLE -->
        <td>
          <span class="user-role-badge role-${getRoleClass(u.role)}">
            ${u.role.toUpperCase()}
          </span>
        </td>

        <!-- STATUS -->
        <td>
          <span class="online-dot ${u.online ? 'dot-on' : 'dot-off'}"></span>
          ${u.online ? 'Online' : 'Offline'}
        </td>

        <!-- LAST LOGIN -->
        <td style="font-family:var(--font-mono);font-size:11.5px;color:var(--text2)">
          ${u.login}
        </td>

        <!-- PERMISSIONS -->
        <td>
          <div class="perm-table">
            ${permsHTML}
          </div>
        </td>

        <!-- ACTIONS -->
        <td>
          <div style="display:flex;gap:6px">
            <button class="action-btn" onclick="editUser('${u.user}')">
              Edit
            </button>
            <button class="action-btn danger" onclick="revokeUser('${u.user}')">
              Revoke
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}
function editUser(username) {
  showToast(`Edit user: ${username}`, 'info');
  // future: open modal / edit form
}

function revokeUser(username) {
  const confirmAction = confirm(`Revoke access for ${username}?`);
  if (!confirmAction) return;

  showToast(`Access revoked for ${username}`, 'warning');
  // future: remove from USERS or update role
}
// =================== PERM MATRIX ===================
// 1. Keep data outside the function for performance
const SYSCALL_MATRIX = SYSCALLS.map(s => ({
  name: s.name,
  category: s.cat,
  admin: true,
  dev: s.perm === 'all' || s.perm === 'dev',
  user: s.perm === 'all',
  auditor: s.perm === 'all'
}));

function buildPermMatrix(filter = '') {
  const tbody = document.getElementById('perm-matrix');
  if (!tbody) return;

  // 2. Filter logic looks great
  const filtered = SYSCALL_MATRIX.filter(s =>
    s.name.toLowerCase().includes(filter.toLowerCase()) ||
    s.category.toLowerCase().includes(filter.toLowerCase())
  );

  // 3. Helper for icons
  const getStatusCell = (val) =>
    val
      ? `<td style="text-align:center;color:#16a34a;font-weight:600;">✓</td>`
      : `<td style="text-align:center;color:#dc2626;">✗</td>`;

  // 4. Update DOM
  if (filtered.length === 0) {
  tbody.innerHTML = `
    <tr>
      <td colspan="6" style="text-align:center;padding:20px;color:#9ca3af;">
        No matching syscalls found
      </td>
    </tr>
  `;
  return;
}

tbody.innerHTML = filtered.map(s => `
  <tr>
    <td style="padding:8px 12px;font-family:monospace;font-size:13px;">${s.name}</td>
    <td style="padding:8px 12px;font-size:12px;color:#6b7280;">${s.category}</td>
    ${getStatusCell(s.admin)}
    ${getStatusCell(s.dev)}
    ${getStatusCell(s.user)}
    ${getStatusCell(s.auditor)}
  </tr>
`).join('');
}

// =================== CHART ===================
function buildActivityChart() {
  const chart = document.getElementById('activity-chart');
  const hours = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','Now'];
  const vals = [120, 340, 280, 520, 190, 430, 610, 380];
  const max = Math.max(...vals);
  chart.innerHTML = vals.map((v, i) => `
    <div class="bar-col">
      <div class="bar" style="height:${Math.round(v/max*90)}px;background:${i===7?'var(--accent)':'var(--border2)'}"></div>
      <div class="bar-label">${hours[i]}</div>
    </div>`).join('');
}

// =================== LIVE FEED ===================
const feedSyscalls = ['read','write','open','close','fork','getpid','getuid','mmap','socket','execve'];
const feedUsers = ['dev1','user1','root','audit'];

function startLiveFeed() {
  const feed = document.getElementById('live-feed');
  function addFeedItem() {
    const sc = feedSyscalls[Math.floor(Math.random()*feedSyscalls.length)];
    const u = feedUsers[Math.floor(Math.random()*feedUsers.length)];
    const ok = Math.random() > 0.1;
    const pid = Math.floor(Math.random()*9000+1000);
    const ret = ok ? Math.floor(Math.random()*10) : -1;
    const ts = new Date().toLocaleTimeString();
    const line = document.createElement('div');
    line.style.cssText = 'display:flex;gap:12px;padding:2px 0;border-bottom:1px solid var(--border);';
    line.innerHTML = `<span style="color:var(--text3);min-width:70px">${ts}</span><span style="color:var(--info);min-width:60px">${u}</span><span style="color:var(--accent);min-width:80px">${sc}()</span><span style="color:var(--text3);min-width:60px">PID ${pid}</span><span style="color:${ok?'var(--success)':'var(--danger)'}">${ok?'✓ OK':'✗ DENIED'} (${ret})</span>`;
    feed.insertBefore(line, feed.firstChild);
    if (feed.children.length > 20) feed.removeChild(feed.lastChild);
  }
  addFeedItem();
  if (window._feedInterval) clearInterval(window._feedInterval);
  window._feedInterval = setInterval(addFeedItem, 2200);
} 

function updateStats() {
  document.getElementById('stat-total').textContent = (2847 + logs.filter(l=>l.status==='success').length).toLocaleString();
  document.getElementById('stat-denied').textContent = (143 + logs.filter(l=>l.status==='denied').length);
}

// =================== TAB SWITCH ===================
function switchTab(name, btn) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  btn.classList.add('active');
}

// Seed some initial log entries
const seedSyscalls = ['read','write','open','fork','getpid','execve','mmap','socket','close','kill','setuid'];
const seedUsers = ['dev1','user1','root','dev2','audit'];
const seedStatuses = ['success','success','success','success','denied','warning'];
for (let i=0; i<40; i++) {
  const sc = seedSyscalls[Math.floor(Math.random()*seedSyscalls.length)];
  const u = seedUsers[Math.floor(Math.random()*seedUsers.length)];
  const s = seedStatuses[Math.floor(Math.random()*seedStatuses.length)];
  const pid = Math.floor(Math.random()*9000+1000);
  const ret = s==='success' ? Math.floor(Math.random()*100) : -1;
  const d = new Date(Date.now() - Math.random()*3600000*8);
  logs.push({ id: 40-i, ts: d.toISOString().replace('T',' ').slice(0,19), user:u, syscall:sc, args:'/tmp/file_'+i, pid, status:s, ret });
}
window.runTerminalCommand = runTerminalCommand;
