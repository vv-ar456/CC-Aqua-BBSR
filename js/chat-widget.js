// ═══════════════════════════════════════════════════════
//  AQUANICS — Floating Chat Widget
//  Add <script src="js/chat-widget.js"></script> to any page
// ═══════════════════════════════════════════════════════

(function() {
'use strict';

const SUPABASE_URL = 'https://dwfbqgkhefdzljewatvx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3ZmJxZ2toZWZkemxqZXdhdHZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0NDQ3NjYsImV4cCI6MjA5MTAyMDc2Nn0.tiZ7786a6J41geK9HZs-nFMe00cPlXDX1ptYQ-EQ1B4';

// Don't inject on support.html page itself
if (location.pathname.includes('support.html')) return;

const CSS = `
#aq-chat-fab {
  position: fixed;
  bottom: 90px; right: 24px;
  width: 52px; height: 52px;
  background: linear-gradient(135deg, #062035, #0a2d4a);
  border-radius: 16px;
  border: 1.5px solid rgba(0,212,170,.3);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  z-index: 850;
  box-shadow: 0 4px 20px rgba(0,0,0,.35);
  transition: all .3s cubic-bezier(.34,1.56,.64,1);
  font-size: 22px;
}
#aq-chat-fab:hover { transform: scale(1.1) rotate(-5deg); box-shadow: 0 8px 32px rgba(0,0,0,.4); }
#aq-chat-fab .unread-dot {
  position: absolute; top: -4px; right: -4px;
  width: 18px; height: 18px;
  background: #f0a843; color: #fff;
  font-size: 10px; font-weight: 800;
  border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  border: 2px solid #f5f9f8;
  display: none;
}
#aq-chat-panel {
  position: fixed;
  bottom: 152px; right: 24px;
  width: 340px;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0,0,0,.25);
  border: 1.5px solid rgba(0,212,170,.15);
  z-index: 860;
  overflow: hidden;
  transform: scale(.85) translateY(20px);
  transform-origin: bottom right;
  opacity: 0;
  pointer-events: none;
  transition: all .3s cubic-bezier(.34,1.56,.64,1);
  font-family: 'DM Sans', sans-serif;
  max-height: 480px;
  display: flex; flex-direction: column;
}
#aq-chat-panel.open {
  transform: scale(1) translateY(0);
  opacity: 1;
  pointer-events: auto;
}
.wg-header {
  background: linear-gradient(135deg, #062035, #0a2d4a);
  padding: 16px 18px;
  display: flex; align-items: center; gap: 12px;
  flex-shrink: 0;
}
.wg-logo { font-size: 22px; }
.wg-title { flex: 1; }
.wg-title strong { display:block; font-size:14px; font-weight:700; color:#fff; }
.wg-title span { font-size:11.5px; color:rgba(255,255,255,.45); }
.wg-status { width:8px; height:8px; border-radius:50%; background:#00d4aa; flex-shrink:0; box-shadow:0 0 8px #00d4aa; }
.wg-close { background:none; border:none; color:rgba(255,255,255,.4); font-size:18px; cursor:pointer; padding:0; line-height:1; }
.wg-close:hover { color:#fff; }
.wg-body { flex:1; overflow-y:auto; padding:16px; display:flex; flex-direction:column; gap:10px; max-height:260px; scrollbar-width:none; }
.wg-body::-webkit-scrollbar { display:none; }
.wg-thread {
  padding:12px 14px; background:#f5f9f8; border-radius:12px;
  cursor:pointer; border:1.5px solid transparent;
  transition:all .2s; text-decoration:none; display:block;
}
.wg-thread:hover { border-color:#00d4aa; background:#f0fbf8; }
.wg-thread-title { font-size:13px; font-weight:600; color:#0d1e1c; margin-bottom:3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.wg-thread-sub { font-size:11.5px; color:#7fa9a3; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.wg-thread-unread { display:inline-block; background:#f0a843; color:#fff; font-size:9.5px; font-weight:800; padding:1.5px 6px; border-radius:8px; margin-left:6px; vertical-align:middle; }
.wg-empty { text-align:center; padding:24px 16px; color:#7fa9a3; font-size:13px; }
.wg-empty .ico { font-size:36px; margin-bottom:8px; }
.wg-footer { padding:12px 16px; border-top:1px solid #edf4f2; flex-shrink:0; display:flex; gap:8px; }
.wg-new-btn {
  flex:1; padding:10px; background:linear-gradient(135deg,#00d4aa,#00a882);
  color:#031520; border:none; border-radius:10px;
  font-size:13px; font-weight:700; font-family:'DM Sans',sans-serif;
  cursor:pointer; transition:all .2s;
}
.wg-new-btn:hover { transform:translateY(-1px); box-shadow:0 4px 14px rgba(0,212,170,.3); }
.wg-full-btn {
  padding:10px 14px; background:#f5f9f8;
  color:#00a882; border:none; border-radius:10px;
  font-size:13px; font-weight:600; font-family:'DM Sans',sans-serif;
  cursor:pointer; transition:background .2s; white-space:nowrap;
}
.wg-full-btn:hover { background:#e6faf5; }
.wg-login-prompt { padding:20px 16px; text-align:center; }
.wg-login-prompt p { font-size:13px; color:#7fa9a3; margin-bottom:12px; }
.wg-login-prompt a { display:inline-flex;align-items:center;gap:6px;padding:10px 20px;background:linear-gradient(135deg,#00d4aa,#00a882);color:#031520;border-radius:10px;font-size:13px;font-weight:700;text-decoration:none; }
@media(max-width:400px) {
  #aq-chat-panel { width:calc(100vw - 32px); right:16px; bottom:100px; }
  #aq-chat-fab { right:16px; }
}`;

// Inject CSS
const styleEl = document.createElement('style');
styleEl.textContent = CSS;
document.head.appendChild(styleEl);

// Inject HTML
const fab = document.createElement('div');
fab.id = 'aq-chat-fab';
fab.innerHTML = `💬<div class="unread-dot" id="chat-fab-badge">0</div>`;
fab.onclick = toggleWidget;

const panel = document.createElement('div');
panel.id = 'aq-chat-panel';
panel.innerHTML = `
  <div class="wg-header">
    <div class="wg-logo">🐠</div>
    <div class="wg-title">
      <strong>Aquanics Support</strong>
      <span>Usually replies within a few hours</span>
    </div>
    <div class="wg-status"></div>
    <button class="wg-close" onclick="document.getElementById('aq-chat-panel').classList.remove('open')">✕</button>
  </div>
  <div class="wg-body" id="wg-body">
    <div class="wg-empty"><div class="ico">💬</div><p>Loading…</p></div>
  </div>
  <div class="wg-footer">
    <button class="wg-new-btn" onclick="location.href='support.html'">+ New Message</button>
    <button class="wg-full-btn" onclick="location.href='support.html'">Open Inbox</button>
  </div>`;

document.body.appendChild(fab);
document.body.appendChild(panel);

let isOpen = false;

function toggleWidget() {
  isOpen = !isOpen;
  panel.classList.toggle('open', isOpen);
  if (isOpen) loadWidgetThreads();
}

async function loadWidgetThreads() {
  const body = document.getElementById('wg-body');
  const auth = window.Auth;
  if (!auth || !auth.isLoggedIn()) {
    body.innerHTML = `
      <div class="wg-login-prompt">
        <p>Login to view your conversations and get support</p>
        <a href="login.html?redirect=support.html">Login to Chat</a>
      </div>`;
    return;
  }

  const user = auth.getUser();
  if (!window.sb) return;

  try {
    const { data: threads } = await sb.from('support_threads')
      .select('id,subject,status,support_messages(id,message,media_url,sender,read_by_user,created_at)')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(5);

    let totalUnread = 0;

    if (!threads?.length) {
      body.innerHTML = `<div class="wg-empty"><div class="ico">💬</div><p>No conversations yet.<br>Start one below!</p></div>`;
    } else {
      body.innerHTML = threads.map(t => {
        const msgs  = t.support_messages || [];
        const last  = msgs[msgs.length-1];
        const unread= msgs.filter(m => m.sender==='admin' && !m.read_by_user).length;
        totalUnread += unread;
        const preview = last?.media_url ? '📸 Media shared' : (last?.message?.slice(0,45)||'No messages');
        return `
          <a href="support.html?thread=${t.id}" class="wg-thread">
            <div class="wg-thread-title">
              ${t.subject}
              ${unread>0?`<span class="wg-thread-unread">${unread}</span>`:''}
            </div>
            <div class="wg-thread-sub">${preview}</div>
          </a>`;
      }).join('');
    }

    // Update badge
    const badge = document.getElementById('chat-fab-badge');
    if (totalUnread > 0) {
      badge.textContent = totalUnread;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  } catch(e) {}
}

// Check for unread on load
async function checkUnread() {
  const auth = window.Auth;
  if (!auth?.isLoggedIn()) return;
  const user = auth.getUser();
  try {
    const { count } = await sb.from('support_messages')
      .select('*', { count: 'exact', head: true })
      .eq('sender', 'admin')
      .eq('read_by_user', false);
    if (count > 0) {
      const badge = document.getElementById('chat-fab-badge');
      badge.textContent = count;
      badge.style.display = 'flex';
    }
  } catch(e) {}
}

setTimeout(checkUnread, 1500);

})();
