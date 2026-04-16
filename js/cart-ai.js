// ═══════════════════════════════════════════════════════
//  AQUANICS — AI Cart Compatibility Agent
//  Powered by Claude claude-sonnet-4-20250514 via Anthropic API
// ═══════════════════════════════════════════════════════

(function () {
'use strict';

// Don't run on pages where cart isn't relevant
if (!['cart.html', 'checkout.html'].some(p => location.pathname.includes(p)) &&
    !location.pathname.endsWith('/') && !location.pathname.includes('cart')) {
  // Still inject the floating widget on all pages for quick access
}

/* ── STYLES ─────────────────────────────────────────── */
const CSS = `
#aq-ai-agent {
  position: fixed;
  bottom: 148px;
  right: 24px;
  z-index: 870;
  font-family: 'DM Sans', sans-serif;
}

/* FAB button */
.ai-fab {
  width: 52px; height: 52px;
  background: linear-gradient(135deg, #7c3aed, #4f46e5);
  border-radius: 16px;
  border: none;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 22px;
  box-shadow: 0 4px 20px rgba(124,58,237,.45);
  transition: all .3s cubic-bezier(.34,1.56,.64,1);
  position: relative;
}
.ai-fab:hover { transform: scale(1.1) rotate(5deg); box-shadow: 0 8px 32px rgba(124,58,237,.55); }
.ai-fab .ai-pulse {
  position: absolute;
  inset: -3px;
  border-radius: 18px;
  border: 2px solid rgba(124,58,237,.4);
  animation: aiPulse 2s ease-in-out infinite;
}
@keyframes aiPulse { 0%,100%{transform:scale(1);opacity:.6} 50%{transform:scale(1.1);opacity:0} }
.ai-fab-badge {
  position: absolute; top: -5px; right: -5px;
  width: 18px; height: 18px;
  background: #f0a843;
  color: #fff; font-size: 10px; font-weight: 800;
  border-radius: 9px;
  display: none;
  align-items: center; justify-content: center;
  border: 2px solid #f5f9f8;
}
.ai-fab-badge.show { display: flex; }

/* Panel */
.ai-panel {
  position: absolute;
  bottom: 62px; right: 0;
  width: 360px;
  background: #fff;
  border-radius: 22px;
  box-shadow: 0 20px 60px rgba(0,0,0,.22), 0 0 0 1px rgba(124,58,237,.1);
  overflow: hidden;
  transform: scale(.85) translateY(16px);
  transform-origin: bottom right;
  opacity: 0;
  pointer-events: none;
  transition: all .3s cubic-bezier(.34,1.56,.64,1);
  max-height: 520px;
  display: flex; flex-direction: column;
}
.ai-panel.open {
  transform: scale(1) translateY(0);
  opacity: 1;
  pointer-events: auto;
}

/* Header */
.ai-header {
  padding: 16px 18px;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  display: flex; align-items: center; gap: 12px;
  flex-shrink: 0;
}
.ai-avatar {
  width: 38px; height: 38px;
  background: rgba(255,255,255,.18);
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}
.ai-avatar.thinking { animation: aiThink 1.5s ease-in-out infinite; }
@keyframes aiThink { 0%,100%{transform:scale(1)} 50%{transform:scale(1.12) rotate(5deg)} }
.ai-header-text { flex: 1; }
.ai-header-text strong { display:block; font-size:14px; font-weight:700; color:#fff; }
.ai-header-text span  { font-size:11.5px; color:rgba(255,255,255,.55); }
.ai-close { background:none; border:none; color:rgba(255,255,255,.5); font-size:18px; cursor:pointer; padding:2px; }
.ai-close:hover { color:#fff; }

/* Body */
.ai-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  scrollbar-width: thin;
  scrollbar-color: #e0e0e0 transparent;
}
.ai-body::-webkit-scrollbar { width: 4px; }
.ai-body::-webkit-scrollbar-thumb { background: #e0e0e0; border-radius: 2px; }

/* Welcome state */
.ai-welcome {
  text-align: center;
  padding: 20px 12px;
}
.ai-welcome .icon { font-size: 40px; margin-bottom: 10px; }
.ai-welcome h4 { font-size: 15px; font-weight: 700; color: #1a1a2e; margin-bottom: 6px; font-family: 'Syne', sans-serif; }
.ai-welcome p { font-size: 13px; color: #888; line-height: 1.6; margin-bottom: 14px; }

/* Analysis button */
.ai-analyze-btn {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  color: #fff;
  border: none; border-radius: 12px;
  font-size: 14px; font-weight: 700;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  transition: all .25s;
}
.ai-analyze-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(79,70,229,.35); }
.ai-analyze-btn:disabled { opacity: .6; cursor: not-allowed; transform: none; box-shadow: none; }

/* Cart items preview */
.ai-cart-items {
  background: #f8f9ff;
  border-radius: 12px;
  padding: 12px 14px;
  border: 1px solid rgba(79,70,229,.1);
}
.ai-cart-items h5 {
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: .5px; color: #888; margin-bottom: 8px;
}
.ai-cart-item {
  display: flex; align-items: center; gap: 8px;
  padding: 5px 0;
  font-size: 13px; color: #333;
  border-bottom: 1px solid #eee;
}
.ai-cart-item:last-child { border-bottom: none; }
.ai-cart-item .item-emoji { font-size: 16px; flex-shrink: 0; }
.ai-cart-item .item-name { flex: 1; }
.ai-cart-item .item-qty { color: #888; font-size: 12px; }

/* Thinking animation */
.ai-thinking {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 16px;
  background: #f8f9ff;
  border-radius: 14px;
  border: 1px solid rgba(79,70,229,.12);
}
.ai-thinking-dots { display: flex; gap: 5px; }
.ai-thinking-dots span {
  width: 8px; height: 8px; border-radius: 50%;
  background: #7c3aed;
  animation: dotBounce 1.4s infinite;
}
.ai-thinking-dots span:nth-child(2) { animation-delay: .2s; }
.ai-thinking-dots span:nth-child(3) { animation-delay: .4s; }
@keyframes dotBounce { 0%,100%{transform:translateY(0);opacity:.4} 50%{transform:translateY(-6px);opacity:1} }
.ai-thinking-text { font-size: 13px; color: #666; }

/* Result cards */
.ai-result {
  border-radius: 14px;
  padding: 14px;
  border: 1px solid;
  animation: resultIn .4s cubic-bezier(.34,1.56,.64,1);
}
@keyframes resultIn { from{opacity:0;transform:translateY(10px) scale(.97)} to{opacity:1;transform:none} }

.ai-result.safe {
  background: linear-gradient(135deg, #e6faf5, #f0fbf8);
  border-color: rgba(0,168,130,.2);
}
.ai-result.warning {
  background: linear-gradient(135deg, #fffbeb, #fef9e7);
  border-color: rgba(240,168,67,.3);
}
.ai-result.danger {
  background: linear-gradient(135deg, #fff1f0, #fde8e8);
  border-color: rgba(239,68,68,.2);
}
.ai-result.tip {
  background: linear-gradient(135deg, #f0f1ff, #eef0ff);
  border-color: rgba(79,70,229,.18);
}

.ai-result-header {
  display: flex; align-items: center; gap: 9px;
  margin-bottom: 8px;
}
.ai-result-icon { font-size: 18px; flex-shrink: 0; }
.ai-result-title { font-size: 13px; font-weight: 700; }
.ai-result.safe    .ai-result-title { color: #007a60; }
.ai-result.warning .ai-result-title { color: #92400e; }
.ai-result.danger  .ai-result-title { color: #b91c1c; }
.ai-result.tip     .ai-result-title { color: #3730a3; }

.ai-result-body { font-size: 13px; line-height: 1.6; color: #444; }

/* Summary bar */
.ai-summary {
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  border-radius: 12px;
  padding: 12px 14px;
  display: flex; align-items: center; gap: 10px;
}
.ai-summary-icon { font-size: 20px; }
.ai-summary-text { flex: 1; }
.ai-summary-text strong { display:block; font-size:13px; font-weight:700; color:#fff; margin-bottom:2px; }
.ai-summary-text span   { font-size:12px; color:rgba(255,255,255,.6); }

/* Recheck */
.ai-recheck {
  text-align: center; padding: 4px 0;
}
.ai-recheck button {
  background: none; border: 1px solid rgba(79,70,229,.25);
  color: #4f46e5; font-size: 12px; font-weight: 600;
  padding: 7px 16px; border-radius: 20px; cursor: pointer;
  transition: all .2s; font-family: 'DM Sans', sans-serif;
}
.ai-recheck button:hover { background: rgba(79,70,229,.06); }

/* Empty cart */
.ai-empty { text-align:center; padding:24px 16px; color:#aaa; font-size:13px; }

@media(max-width:420px) {
  #aq-ai-agent { right: 16px; bottom: 90px; }
  .ai-panel { width: calc(100vw - 32px); }
}
`;

/* ── HTML ────────────────────────────────────────────── */
const HTML = `
<button class="ai-fab" id="ai-fab-btn" onclick="toggleAIPanel()" title="AI Cart Advisor">
  <div class="ai-pulse"></div>
  🤖
  <div class="ai-fab-badge" id="ai-fab-badge"></div>
</button>
<div class="ai-panel" id="ai-panel">
  <div class="ai-header">
    <div class="ai-avatar" id="ai-avatar">🤖</div>
    <div class="ai-header-text">
      <strong>Aqua AI Advisor</strong>
      <span id="ai-status-text">Ready to check your cart</span>
    </div>
    <button class="ai-close" onclick="closeAIPanel()">✕</button>
  </div>
  <div class="ai-body" id="ai-body">
    <div class="ai-welcome">
      <div class="icon">🛒✨</div>
      <h4>Smart Cart Check</h4>
      <p>I'll check your cart for compatibility issues — like fish aggression, diet mismatches, and unsafe combinations.</p>
    </div>
    <div id="ai-cart-preview"></div>
    <button class="ai-analyze-btn" id="ai-analyze-btn" onclick="runAIAnalysis()">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
      Check Cart Compatibility
    </button>
  </div>
</div>`;

/* ── Inject ───────────────────────────────────────────── */
function inject() {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const wrap = document.createElement('div');
  wrap.id = 'aq-ai-agent';
  wrap.innerHTML = HTML;
  document.body.appendChild(wrap);

  updateCartPreview();
}

/* ── Panel toggle ─────────────────────────────────────── */
let panelOpen = false;
window.toggleAIPanel = function () {
  panelOpen = !panelOpen;
  document.getElementById('ai-panel').classList.toggle('open', panelOpen);
  if (panelOpen) updateCartPreview();
};
window.closeAIPanel = function () {
  panelOpen = false;
  document.getElementById('ai-panel').classList.remove('open');
};

/* ── Cart preview ─────────────────────────────────────── */
const CAT_EM = {
  'live-fish':'🐠', 'aquariums':'🐟', 'birds':'🦜',
  'dogs':'🐶', 'cats':'🐱', 'accessories':'🛒',
  'other-pets':'🐾', 'food':'🥣', 'toys':'🎾', 'default':'📦'
};
function getEmoji(item) {
  const cat = (item.category_slug || item.category || '').toLowerCase();
  return CAT_EM[cat] || (item.name?.match(/fish|betta|tetra|goldfish|cichlid|guppy/i) ? '🐠' :
    item.name?.match(/bird|parrot|finch|canary|cockatiel/i) ? '🦜' :
    item.name?.match(/dog|puppy/i) ? '🐶' :
    item.name?.match(/cat|kitten/i) ? '🐱' : '📦');
}

function updateCartPreview() {
  const preview = document.getElementById('ai-cart-preview');
  if (!preview) return;
  let items = [];
  try {
    // localStorage is always reliable - Cart.save() always writes here
    const raw = localStorage.getItem('aq_cart');
    items = raw ? JSON.parse(raw) : [];
    if(!Array.isArray(items)) items = [];
  } catch(e) { items = []; }
  const badge = document.getElementById('ai-fab-badge');

  if (!items.length) {
    preview.innerHTML = '<div class="ai-empty">Add items to your cart to check compatibility</div>';
    if (badge) badge.classList.remove('show');
    return;
  }

  if (badge) { badge.textContent = items.length; badge.classList.add('show'); }
  preview.innerHTML = `
    <div class="ai-cart-items">
      <h5>Cart (${items.length} item${items.length > 1 ? 's' : ''})</h5>
      ${items.map(i => `
        <div class="ai-cart-item">
          <span class="item-emoji">${getEmoji(i)}</span>
          <span class="item-name">${i.name}</span>
          <span class="item-qty">×${i.qty}</span>
        </div>`).join('')}
    </div>`;
}

/* ── AI Analysis ──────────────────────────────────────── */
window.runAIAnalysis = async function () {
  let items = [];
  try {
    const raw = localStorage.getItem('aq_cart');
    items = raw ? JSON.parse(raw) : [];
    if(!Array.isArray(items)) items = [];
  } catch(e) { items = []; }
  if (!items.length) {
    document.getElementById('ai-body').innerHTML = '<div class="ai-empty">Your cart is empty. Add some items first!</div>';
    return;
  }

  const btn    = document.getElementById('ai-analyze-btn');
  const avatar = document.getElementById('ai-avatar');
  const status = document.getElementById('ai-status-text');
  const body   = document.getElementById('ai-body');

  btn.disabled = true;
  avatar.classList.add('thinking');
  status.textContent = 'Analyzing your cart…';

  // Show thinking state
  body.innerHTML = `
    <div class="ai-thinking">
      <div class="ai-thinking-dots"><span></span><span></span><span></span></div>
      <div class="ai-thinking-text">Checking compatibility, diet & safety…</div>
    </div>`;

  try {
    const cartSummary = items.map(i =>
      `- ${i.name} (qty: ${i.qty}, category: ${i.category_slug || 'unknown'}, price: ₹${i.price})`
    ).join('\n');

    const prompt = `You are an expert pet and aquarium advisor for an Indian online pet store called Aquanics.

A customer has the following items in their cart:
${cartSummary}

Analyze this cart and respond with a JSON array of advice cards. Each card should have:
- "type": one of "safe" | "warning" | "danger" | "tip"
- "title": short title (max 6 words)
- "body": 1-2 line advice in simple, friendly Hindi-English mix is fine (beginner-friendly)

Rules:
- "danger" = items that should NOT be together (e.g. aggressive fish + small fish, cats + birds without precautions)
- "warning" = items that need care (e.g. betta fish alone, special diet needs)
- "safe" = things that work well together
- "tip" = a helpful suggestion or pro tip
- Max 4 cards total. Keep each body under 2 lines.
- If cart has only accessories/food with no live animals, give 1 safe + 1 relevant tip.
- Be specific to the actual items, not generic advice.
- ONLY return valid JSON array, no markdown, no explanation.

Example format:
[{"type":"warning","title":"Betta needs solo tank","body":"Betta fish are aggressive and should be kept alone. Add a divider if you plan to add tank mates."},{"type":"tip","title":"Great filter choice","body":"The canister filter you selected works perfectly for tanks up to 50 gallons. Good pick!"}]`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    const raw  = data.content?.[0]?.text || '[]';

    // Parse JSON safely
    let cards = [];
    try {
      const cleaned = raw.replace(/```json|```/g, '').trim();
      cards = JSON.parse(cleaned);
    } catch(e) {
      cards = [{ type: 'tip', title: 'Cart looks good!', body: 'No major compatibility issues found in your selection.' }];
    }

    // Count warnings/dangers
    const issues = cards.filter(c => c.type === 'danger' || c.type === 'warning').length;

    // Render results
    const summaryType = issues === 0 ? '✅' : issues === 1 ? '⚠️' : '🚨';
    const summaryText = issues === 0
      ? 'All items look compatible!'
      : `${issues} thing${issues > 1 ? 's' : ''} to note`;
    const summarySubtext = issues === 0
      ? 'Great cart combination'
      : 'Review the notes below before checkout';

    body.innerHTML = `
      <div class="ai-summary">
        <div class="ai-summary-icon">${summaryType}</div>
        <div class="ai-summary-text">
          <strong>${summaryText}</strong>
          <span>${summarySubtext}</span>
        </div>
      </div>
      ${cards.map(c => `
        <div class="ai-result ${c.type}">
          <div class="ai-result-header">
            <div class="ai-result-icon">${
              c.type==='safe'?'✅':c.type==='warning'?'⚠️':c.type==='danger'?'🚨':'💡'
            }</div>
            <div class="ai-result-title">${c.title}</div>
          </div>
          <div class="ai-result-body">${c.body}</div>
        </div>`).join('')}
      <div class="ai-recheck">
        <button onclick="resetAIPanel()">↻ Re-check Cart</button>
      </div>`;

    status.textContent = `${cards.length} insight${cards.length !== 1 ? 's' : ''} found`;
    if (issues > 0 && badge) { badge.textContent = '!'; badge.classList.add('show'); }

  } catch(e) {
    console.error('AI Advisor error:', e);
    body.innerHTML = `
      <div class="ai-result warning">
        <div class="ai-result-header">
          <div class="ai-result-icon">⚠️</div>
          <div class="ai-result-title">Could not analyze</div>
        </div>
        <div class="ai-result-body">AI check is temporarily unavailable. Please ensure your cart items are compatible before purchasing.</div>
      </div>
      <div class="ai-recheck"><button onclick="resetAIPanel()">Try Again</button></div>`;
    status.textContent = 'Offline';
  }

  avatar.classList.remove('thinking');
  btn.disabled = false;
};

window.resetAIPanel = function () {
  const body = document.getElementById('ai-body');
  const status = document.getElementById('ai-status-text');
  status.textContent = 'Ready to check your cart';
  updateCartPreview();
  const btn = `<button class="ai-analyze-btn" id="ai-analyze-btn" onclick="runAIAnalysis()">
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
    Check Cart Compatibility
  </button>`;
  body.innerHTML = `
    <div class="ai-welcome">
      <div class="icon">🛒✨</div>
      <h4>Smart Cart Check</h4>
      <p>I'll check your cart for compatibility issues.</p>
    </div>
    <div id="ai-cart-preview"></div>
    ${btn}`;
  updateCartPreview();
};

// Auto-open on cart page with a delay
if (location.pathname.includes('cart')) {
  setTimeout(() => {
    updateCartPreview();
    let items = []; try { const r=localStorage.getItem('aq_cart'); items=r?JSON.parse(r):[]; if(!Array.isArray(items))items=[]; } catch(e) { items = []; }
    if (items.length >= 2) {
      // Show pulsing badge to hint at AI check
      const badge = document.getElementById('ai-fab-badge');
      if (badge) { badge.textContent = '✦'; badge.classList.add('show'); }
    }
  }, 1200);
}

// Patch Cart.save to trigger preview updates
function patchCart(){
  if(!window.Cart || window.Cart._aiPatched) return;
  const origSave = Cart.save.bind(Cart);
  Cart.save = function(v){ origSave(v); setTimeout(updateCartPreview, 80); };
  window.Cart._aiPatched = true;
}

// Also listen for storage events (works across tabs and within same page)
window.addEventListener('storage', e => {
  if(e.key === 'aq_cart') setTimeout(updateCartPreview, 80);
});

// Init - wait for DOM + Cart to be ready
function doInit(){
  patchCart();
  inject();
  // Re-patch after short delay in case app.js wasn't ready
  setTimeout(patchCart, 500);
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', doInit);
} else {
  doInit();
}

})();
