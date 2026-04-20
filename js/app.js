// ═══════════════════════════════════════════════════
//  AQUANICS — Shared App  (app.js)
// ═══════════════════════════════════════════════════

const SUPABASE_URL  = 'https://dwfbqgkhefdzljewatvx.supabase.co';
const SUPABASE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3ZmJxZ2toZWZkemxqZXdhdHZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0NDQ3NjYsImV4cCI6MjA5MTAyMDc2Nn0.tiZ7786a6J41geK9HZs-nFMe00cPlXDX1ptYQ-EQ1B4';
const RAZORPAY_KEY  = 'rzp_live_SSegtOEGykPOUN';
const TWOFACTOR_KEY = '2503bcf6-237e-11f1-bcb0-0200cd936042';

const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Cart ─────────────────────────────────────────────
const Cart = {
  key:'aq_cart',
  _sid: id => String(id),  // normalize id to string for comparison
  get(){  try{return JSON.parse(localStorage.getItem(this.key)||'[]')}catch{return[]} },
  save(v){ localStorage.setItem(this.key,JSON.stringify(v)); this.badge(); },
  clear(){ localStorage.removeItem(this.key); this.badge(); },
  total(){ return this.get().reduce((s,i)=>s+(+i.price)*(+i.qty),0); },
  count(){ return this.get().reduce((s,i)=>s+(+i.qty),0); },
  add(p,qty=1){
    const items=this.get();
    const sid=this._sid(p.id);
    const i=items.findIndex(x=>this._sid(x.id)===sid);
    if(i>-1) items[i].qty+=(+qty); else items.push({...p,id:sid,qty:(+qty)});
    this.save(items);
    showToast('🛒 '+(p.name||'Item')+' added to cart!');
  },
  remove(id){
    const sid=this._sid(id);
    this.save(this.get().filter(i=>this._sid(i.id)!==sid));
  },
  updateQty(id,qty){
    const sid=this._sid(id);
    const items=this.get();
    const i=items.findIndex(x=>this._sid(x.id)===sid);
    if(i<0) return;
    if((+qty)<=0) items.splice(i,1); else items[i].qty=(+qty);
    this.save(items);
  },
  badge(){
    const n=this.count();
    document.querySelectorAll('.cart-count,.nav-badge').forEach(el=>{
      el.textContent=n; el.style.display=n>0?'flex':'none';
    });
  }
};

// ── Wishlist ─────────────────────────────────────────
const WL = {
  key:'aq_wish',
  get(){ try{return JSON.parse(localStorage.getItem(this.key)||'[]')}catch{return[]} },
  has(id){ return this.get().includes(+id); },
  toggle(id){
    let w=this.get(); const n=+id;
    w=w.includes(n)?w.filter(x=>x!==n):[...w,n];
    localStorage.setItem(this.key,JSON.stringify(w));
    return w.includes(n);
  }
};

// ── Auth ─────────────────────────────────────────────
const Auth = {
  key:'aq_sess',
  get(){ try{return JSON.parse(localStorage.getItem(this.key))}catch{return null} },
  isLoggedIn(){ return !!this.get(); },
  getUser(){ return this.get()?.user||null; },
  set(user,token){ localStorage.setItem(this.key,JSON.stringify({user,token})); },
  clear(){ localStorage.removeItem(this.key); },
  async logout(){
    const s=this.get();
    if(s?.token) await sb.from('sessions').delete().eq('token',s.token).catch(()=>{});
    this.clear(); location.href='login.html';
  },
  requireAuth(){
    if(!this.isLoggedIn())
      location.href='login.html?redirect='+encodeURIComponent(location.pathname+location.search);
  }
};

// ── OTP ──────────────────────────────────────────────
const OTP = {
  async send(phone){
    const r=await fetch(`https://2factor.in/API/V1/${TWOFACTOR_KEY}/SMS/+91${phone}/AUTOGEN/OTP1`);
    const d=await r.json();
    if(d.Status!=='Success') throw new Error(d.Details||'OTP send failed');
    return d.Details;
  },
  async verify(sid,otp){
    const r=await fetch(`https://2factor.in/API/V1/${TWOFACTOR_KEY}/SMS/VERIFY/${sid}/${otp}`);
    const d=await r.json();
    if(d.Status!=='Success') throw new Error('Invalid OTP');
    return true;
  }
};

// ── Format ───────────────────────────────────────────
const fmt = {
  price: n=>'₹'+Number(n||0).toLocaleString('en-IN'),
  date:  d=>new Date(d).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}),
  short: d=>new Date(d).toLocaleDateString('en-IN',{day:'numeric',month:'short'}),
  stars: r=>{ r=Number(r)||4.5; return '★'.repeat(Math.floor(r))+(r%1>=.5?'½':'')+'☆'.repeat(5-Math.ceil(r)); }
};

// ── Toast ────────────────────────────────────────────
let _toastTimer;
function showToast(msg){
  let el=document.getElementById('toast');
  if(!el){ el=document.createElement('div'); el.id='toast'; el.style.cssText='position:fixed;bottom:90px;right:24px;background:#062035;color:#fff;padding:12px 20px;border-radius:12px;font-size:13.5px;z-index:9999;transform:translateY(20px);opacity:0;transition:all .3s cubic-bezier(.34,1.56,.64,1);box-shadow:0 8px 32px rgba(0,0,0,.35);border:1px solid rgba(0,212,170,.18);pointer-events:none;max-width:280px;font-family:DM Sans,sans-serif'; document.body.appendChild(el); }
  clearTimeout(_toastTimer);
  el.textContent=msg; el.style.opacity='1'; el.style.transform='none';
  _toastTimer=setTimeout(()=>{ el.style.opacity='0'; el.style.transform='translateY(20px)'; },2800);
}

// ── DB helpers ────────────────────────────────────────
const DB = {
  async cats(){
    const {data}=await sb.from('categories').select('*,subcategories(*)').eq('active',true).order('sort_order');
    return data||[];
  },
  async bestsellers(n=8){
    const {data}=await sb.from('products').select('*,categories(name,slug)').eq('active',true).order('sales_count',{ascending:false}).limit(n);
    return data||[];
  },
  async latest(n=8){
    const {data}=await sb.from('products').select('*,categories(name,slug)').eq('active',true).order('created_at',{ascending:false}).limit(n);
    return data||[];
  },
  async product(id){
    const {data}=await sb.from('products').select('*,categories(name,slug)').eq('id',id).single();
    return data;
  },
  async related(catSlug,xid,n=4){
    const {data}=await sb.from('products').select('*,categories(name,slug)').eq('category_slug',catSlug).eq('active',true).neq('id',xid).limit(n);
    return data||[];
  }
};

// ── Placeholder data (shown when DB is empty) ─────────
const PH_CATS=[
  {slug:'live-fish',   emoji:'🐠', name:'Live Fish',     description:'Freshwater & Marine'},
  {slug:'aquariums',   emoji:'🐟', name:'Aquariums',     description:'Tanks, Filters, Decor'},
  {slug:'birds',       emoji:'🦜', name:'Birds',         description:'Parrots, Finches & More'},
  {slug:'dogs',        emoji:'🐶', name:'Dogs',          description:'Food, Toys, Accessories'},
  {slug:'cats',        emoji:'🐱', name:'Cats',          description:'Food, Litter, Toys'},
  {slug:'other-pets',  emoji:'🐾', name:'Other Pets',    description:'Small Animals & More'},
  {slug:'accessories', emoji:'🛒', name:'Accessories',   description:'All Pet Supplies'},
];
const CAT_EM={'live-fish':'🐠','aquariums':'🐟','birds':'🦜','dogs':'🐶','cats':'🐱','accessories':'🛒','other-pets':'🐾'};
function phImg(catSlug){
  const em=CAT_EM[catSlug]||'🐠';
  return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="%23edf4f2"/><text x="50%25" y="52%25" font-size="72" text-anchor="middle" dominant-baseline="middle">${encodeURIComponent(em)}</text></svg>`;
}
const PH_PRODS=[
  {id:'ph1', name:'Colorful Betta Fish (Male)',  category_slug:'live-fish', categories:{name:'Live Fish'}, price:350,  mrp:500,  rating:4.8, review_count:124, featured:true},
  {id:'ph2', name:'Neon Tetra (Set of 10)',       category_slug:'live-fish', categories:{name:'Live Fish'}, price:299,  mrp:null, rating:4.6, review_count:89,  featured:false},
  {id:'ph3', name:'10 Gallon Aquarium Kit',       category_slug:'aquariums', categories:{name:'Aquariums'}, price:1999, mrp:2800, rating:4.7, review_count:56,  featured:true},
  {id:'ph4', name:'Purina ONE Kitten Food 2kg',   category_slug:'cats',      categories:{name:'Cats'},      price:699,  mrp:850,  rating:4.8, review_count:150, featured:false},
  {id:'ph5', name:'African Grey Parrot',          category_slug:'birds',     categories:{name:'Birds'},     price:8500, mrp:null, rating:4.9, review_count:32,  featured:true},
  {id:'ph6', name:'Royal Canin Dog Food 3kg',     category_slug:'dogs',      categories:{name:'Dogs'},      price:1850, mrp:2200, rating:4.7, review_count:78,  featured:false},
  {id:'ph7', name:'Flowerhorn Cichlid Fish',      category_slug:'live-fish', categories:{name:'Live Fish'}, price:1200, mrp:1500, rating:4.7, review_count:45,  featured:false},
  {id:'ph8', name:'Canister Filter 500L/hr',      category_slug:'aquariums', categories:{name:'Aquariums'}, price:3499, mrp:4500, rating:4.6, review_count:33,  featured:false},
];

// ── Product card HTML ─────────────────────────────────
function prodCard(p){
  const disc=p.mrp&&p.mrp>p.price?Math.round((1-p.price/p.mrp)*100):0;
  const w=WL.has(p.id);
  const img=p.image_url||phImg(p.category_slug);
  const isReal=!String(p.id).startsWith('ph');
  const href=isReal?`product.html?id=${p.id}`:`products.html?cat=${p.category_slug}`;
  const nm=(p.name||'').replace(/'/g,"\\'").replace(/"/g,'&quot;');
  const im=img.replace(/'/g,"\\'");
  const idStr=isReal?p.id:`'${p.id}'`;
  return `
  <div class="prod-card reveal">
    ${p.featured?'<span class="prod-tag">Featured</span>':''}
    ${disc?`<span class="prod-tag sale"${p.featured?' style="top:38px"':''}>−${disc}%</span>`:''}
    <a href="${href}" class="prod-img-wrap">
      <img src="${img}" alt="${p.name}" loading="lazy" onerror="this.src='${phImg('live-fish').replace(/'/g,"\\'")}'" >
      <button class="prod-wish${w?' on':''}"
        onclick="event.preventDefault();event.stopPropagation();toggleWish(${idStr},this)"
        aria-label="Wishlist">
        <svg viewBox="0 0 24 24" width="16" height="16"
          fill="${w?'#ee0055':'none'}" stroke="${w?'#ee0055':'#888'}" stroke-width="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      </button>
      <div class="prod-overlay">
        <button class="ov-btn ov-cart"
          onclick="event.preventDefault();Cart.add({id:${idStr},name:'${nm}',price:${p.price},image_url:'${im}'})">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          Add to Cart
        </button>
        <a href="${href}" class="ov-btn ov-view">View →</a>
      </div>
    </a>
    <div class="prod-body">
      <div class="prod-cat">${p.categories?.name||''}</div>
      <a href="${href}" class="prod-name">${p.name}</a>
      <div class="prod-stars"><span>${fmt.stars(p.rating||4.5)}</span><span>(${p.review_count||0})</span></div>
      <div class="prod-price">
        <strong>${fmt.price(p.price)}</strong>
        ${p.mrp&&p.mrp>p.price?`<del>${fmt.price(p.mrp)}</del>`:''}
      </div>
    </div>
  </div>`;
}

function toggleWish(id,btn){
  const now=WL.toggle(id);
  btn.classList.toggle('on',now);
  const svg=btn.querySelector('svg');
  if(svg){ svg.setAttribute('fill',now?'#ee0055':'none'); svg.setAttribute('stroke',now?'#ee0055':'#888'); }
  showToast(now?'❤️ Added to wishlist':'Removed from wishlist');
}

// ── Scroll reveal ─────────────────────────────────────
function initReveal(){
  const io=new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(!e.isIntersecting) return;
      e.target.classList.add('in');
      io.unobserve(e.target);
    });
  },{threshold:.1,rootMargin:'0px 0px -30px 0px'});
  document.querySelectorAll('.reveal,.reveal-l,.reveal-r').forEach(el=>{
    if(!el.classList.contains('in')) io.observe(el);
  });
}

// ── Shared nav (for inner pages) ─────────────────────
async function renderNav(activeCat=''){
  const el=document.getElementById('nav');
  if(!el) return;
  const user=Auth.getUser();
  let cats=PH_CATS;
  try{ const c=await DB.cats(); if(c?.length) cats=c; } catch(e){}
  
  // Back button — show on all pages except home
  const isHome = location.pathname.endsWith('index.html') || location.pathname.endsWith('/') || location.pathname === '';
  const backBtn = isHome ? '' : `
    <button onclick="history.length>1?history.back():location.href='index.html'" 
      style="position:fixed;left:12px;bottom:80px;z-index:500;width:42px;height:42px;
        background:rgba(3,21,32,0.85);backdrop-filter:blur(8px);border:1.5px solid rgba(0,212,170,.25);
        border-radius:50%;display:flex;align-items:center;justify-content:center;
        cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.3);transition:all .2s;color:#fff"
      onmouseover="this.style.background='rgba(0,168,130,.9)';this.style.borderColor='#00a882'"
      onmouseout="this.style.background='rgba(3,21,32,0.85)';this.style.borderColor='rgba(0,212,170,.25)'"
      title="Go back">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
    </button>`;
  if(backBtn){ const b=document.createElement('div'); b.innerHTML=backBtn; document.body.appendChild(b.firstElementChild); }
  const catHtml=cats.map(c=>`
    <li class="${activeCat===c.slug?'active':''}">
      <a href="products.html?cat=${c.slug}">${c.emoji||''} ${c.name}</a>
      ${c.subcategories?.length?`<div class="nav-drop">${c.subcategories.map(s=>`<a href="products.html?cat=${c.slug}&sub=${s.slug}">↳ ${s.name}</a>`).join('')}</div>`:''}`
  ).join('</li><li>')+'</li>';

  el.innerHTML=`
  <div class="nav-row">
    <a href="index.html" class="nav-logo"><img src="logo.png" alt="Aquanics"></a>
    <div class="nav-search" id="nav-search-wrap">
      <input id="ns" type="search" autocomplete="off" autocorrect="off" spellcheck="false"
        placeholder="Search fish, aquariums, pets…"
        onkeydown="if(event.key==='Enter'){event.preventDefault();goSearch();}">
      <button class="nav-search-btn" onclick="goSearch()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
      </button>
    </div>
    <button id="ns-toggle" onclick="openSearchModal()"
      style="display:none;background:var(--teal);border:none;border-radius:8px;width:38px;height:38px;align-items:center;justify-content:center;cursor:pointer;color:var(--ocean);flex-shrink:0">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
    </button>
    <div class="nav-actions">
      <button class="nav-btn" onclick="location.href='${user?'account':'login'}.html'">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        <span>${user?(user.name||'').split(' ')[0]:'Login'}</span>
      </button>
      
      <button class="nav-btn" onclick="location.href='cart.html'" style="position:relative">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
        <span class="nav-badge" id="cart-badge" style="display:none">0</span>
        <span>Cart</span>
      </button>
    </div>
  </div>
  <nav>
    <ul class="nav-cats-list">
      <li class="${!activeCat?'active':''}"><a href="index.html">🏠 Home</a></li>
      ${catHtml}
      <li><a href="contact.html">📞 Contact</a></li>
      <li><a href="about.html">ℹ️ About</a></li>
      <li><a href="seller.html">🏪 Sell on Aquanics</a></li>
    </ul>
  </nav>`;
  Cart.badge();
  window.addEventListener('scroll',()=>el.classList.toggle('scrolled',scrollY>20),{passive:true});
}

function goSearch(){
  const q=document.getElementById('ns')?.value?.trim();
  if(q) location.href='products.html?search='+encodeURIComponent(q);
  else { document.getElementById('ns')?.focus(); }
}

function openSearchModal(){
  // Remove existing modal if any
  document.getElementById('search-modal')?.remove();
  const modal=document.createElement('div');
  modal.id='search-modal';
  modal.style.cssText='position:fixed;inset:0;background:rgba(3,21,32,.92);z-index:9998;display:flex;flex-direction:column;padding:16px';
  modal.innerHTML=`
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
      <div style="flex:1;position:relative">
        <input id="ns-modal" type="search" autocomplete="off" autocorrect="off" spellcheck="false"
          placeholder="Search fish, aquariums, pets…"
          style="width:100%;padding:12px 44px 12px 16px;background:rgba(255,255,255,.1);border:1.5px solid rgba(0,212,170,.3);border-radius:12px;color:#fff;font-size:15px;font-family:var(--B);outline:none;-webkit-appearance:none;box-sizing:border-box"
          onkeydown="if(event.key==='Enter'){event.preventDefault();doModalSearch();}"
        >
        <button onclick="doModalSearch()" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:var(--teal);border:none;border-radius:8px;width:32px;height:32px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#031520">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        </button>
      </div>
      <button onclick="document.getElementById('search-modal').remove()" style="background:rgba(255,255,255,.1);border:none;color:#fff;width:40px;height:40px;border-radius:10px;cursor:pointer;font-size:18px;flex-shrink:0">✕</button>
    </div>
    <div id="search-quick" style="display:flex;flex-wrap:wrap;gap:8px">
      ${['Live Fish','Aquariums','Bird Food','Dog Food','Cat Food','Fish Tank'].map(t=>`<button onclick="document.getElementById('ns-modal').value='${t}';doModalSearch()" style="padding:7px 14px;background:rgba(0,212,170,.12);border:1.5px solid rgba(0,212,170,.22);border-radius:20px;color:#00d4aa;font-size:13px;cursor:pointer">${t}</button>`).join('')}
    </div>`;
  document.body.appendChild(modal);
  setTimeout(()=>document.getElementById('ns-modal')?.focus(),100);
}

window.doModalSearch=function(){
  const q=(document.getElementById('ns-modal')?.value||'').trim();
  if(q){document.getElementById('search-modal')?.remove();location.href='products.html?search='+encodeURIComponent(q);}
};

// Inject mobile nav search CSS
(function(){
  const s=document.createElement('style');
  s.textContent=`
    @media(max-width:640px){
      #nav-search-wrap{display:none!important;}
      #ns-toggle{display:flex!important;}
    }
    @media(min-width:641px){
      #ns-toggle{display:none!important;}
      #nav-search-wrap{display:block!important;}
    }
  `;
  document.head.appendChild(s);
})();

// ── Shared footer ─────────────────────────────────────
function renderFooter(){
  const el=document.getElementById('footer')||document.getElementById('footer-wrap');
  if(!el) return;
  el.innerHTML=`
  <footer>
    <div class="footer-grid">
      <div class="footer-brand">
        <img src="logo.png" alt="Aquanics">
        <p>Your trusted destination for premium aquarium fish, birds, pets and all their supplies. Quality assured, ethically sourced.</p>
        <div class="footer-socials">
          <a href="#">📘</a><a href="#">📷</a><a href="#">▶️</a>
          <a href="https://wa.me/919999999999">💬</a>
        </div>
      </div>
      <div class="footer-col"><h5>Quick Links</h5><ul>
        <li><a href="index.html">Home</a></li>
        <li><a href="products.html">All Products</a></li>
        <li><a href="contact.html">Contact Us</a></li>
        <li><a href="about.html">About Us</a></li>
        <li><a href="policies.html#doa">DOA Policy</a></li>
      </ul></div>
      <div class="footer-col"><h5>Customer Care</h5><ul>
        <li><a href="account.html">My Orders</a></li>
        <li><a href="policies.html#returns">Returns</a></li>
        <li><a href="policies.html#shipping">Shipping Info</a></li>
        <li><a href="policies.html#privacy">Privacy Policy</a></li>
      </ul></div>
      <div class="footer-col"><h5>Contact</h5><ul>
        <li><a href="tel:+91XXXXXXXXXX">📞 +91-XXXX-XXXXXX</a></li>
        <li><a href="mailto:support@aquanics.in">✉️ support@aquanics.in</a></li>
        <li><a href="https://wa.me/919999999999">💬 WhatsApp us</a></li>
        <li><a href="#">📍 Bhubaneswar, Odisha</a></li>
      </ul></div>
    </div>
    <div class="footer-bottom">
      <span>© ${new Date().getFullYear()} Aquanics by Coreconics. All rights reserved.</span>
      <span>Powered by Razorpay · Supabase</span>
    </div>
  </footer>`;
}

// ── Init badge on load ────────────────────────────────
document.addEventListener('DOMContentLoaded', ()=>Cart.badge());

// ── UI compatibility object (for products.html) ────────
const UI = {
  nav:    (cat='') => renderNav(cat),
  footer: ()       => renderFooter(),
  card:   (p)      => prodCard(p),
  skels:  (n=8)    => Array(n).fill(`
    <div class="prod-card" style="animation:pulse 1.5s ease-in-out infinite">
      <div style="aspect-ratio:1;background:var(--g1,#edf4f2);border-radius:12px 12px 0 0"></div>
      <div style="padding:12px">
        <div style="height:10px;background:var(--g1,#edf4f2);border-radius:6px;margin-bottom:8px"></div>
        <div style="height:10px;background:var(--g1,#edf4f2);border-radius:6px;width:70%;margin-bottom:8px"></div>
        <div style="height:14px;background:var(--g1,#edf4f2);border-radius:6px;width:40%"></div>
      </div>
    </div>`).join('')
};

// Pulse animation for skeletons
const _skel_style = document.createElement('style');
_skel_style.textContent = '@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}';
document.head.appendChild(_skel_style);

