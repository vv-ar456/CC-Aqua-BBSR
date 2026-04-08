// ── Aquanics Core Config ──────────────────────────────
const SUPABASE_URL    = 'https://dwfbqgkhefdzljewatvx.supabase.co';
const SUPABASE_ANON   = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3ZmJxZ2toZWZkemxqZXdhdHZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0NDQ3NjYsImV4cCI6MjA5MTAyMDc2Nn0.tiZ7786a6J41geK9HZs-nFMe00cPlXDX1ptYQ-EQ1B4';
const RAZORPAY_KEY    = 'rzp_live_SSegtOEGykPOUN';
const TWOFACTOR_KEY   = '2503bcf6-237e-11f1-bcb0-0200cd936042';

const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON);

// ── Auth ─────────────────────────────────────────────
const Auth = {
  _k: 'aq_sess',
  setSession(user, token) { localStorage.setItem(this._k, JSON.stringify({user,token})); },
  getSession()  { try { return JSON.parse(localStorage.getItem(this._k)); } catch { return null; } },
  clearSession(){ localStorage.removeItem(this._k); },
  isLoggedIn()  { return !!this.getSession(); },
  getUser()     { return this.getSession()?.user || null; },
  async logout() {
    const s = this.getSession();
    if (s?.token) await sb.from('sessions').delete().eq('token', s.token).catch(()=>{});
    this.clearSession();
    location.href = '/index.html';
  },
  requireAuth() {
    if (!this.isLoggedIn())
      location.href = '/login.html?redirect=' + encodeURIComponent(location.pathname + location.search);
  }
};

// ── OTP ──────────────────────────────────────────────
const OTP = {
  async send(phone) {
    const r = await fetch(`https://2factor.in/API/V1/${TWOFACTOR_KEY}/SMS/+91${phone}/AUTOGEN/OTP1`);
    const d = await r.json();
    if (d.Status !== 'Success') throw new Error(d.Details || 'OTP send failed');
    return d.Details;
  },
  async verify(sid, otp) {
    const r = await fetch(`https://2factor.in/API/V1/${TWOFACTOR_KEY}/SMS/VERIFY/${sid}/${otp}`);
    const d = await r.json();
    if (d.Status !== 'Success') throw new Error('Invalid OTP');
    return true;
  }
};

// ── Cart ─────────────────────────────────────────────
const Cart = {
  _k: 'aq_cart',
  get()   { try { return JSON.parse(localStorage.getItem(this._k)||'[]'); } catch { return []; } },
  save(i) { localStorage.setItem(this._k, JSON.stringify(i)); this.badge(); },
  clear() { localStorage.removeItem(this._k); this.badge(); },
  total() { return this.get().reduce((s,i)=>s+i.price*i.qty, 0); },
  count() { return this.get().reduce((s,i)=>s+i.qty, 0); },
  add(p, qty=1) {
    const items = this.get();
    const idx = items.findIndex(i=>i.id===p.id);
    if (idx>-1) items[idx].qty+=qty; else items.push({...p, qty});
    this.save(items);
    toast('🛒 '+p.name+' added to cart!');
  },
  remove(id) { this.save(this.get().filter(i=>i.id!==id)); },
  updateQty(id,qty) {
    const items=this.get(); const idx=items.findIndex(i=>i.id===id);
    if(idx<0)return; if(qty<=0)items.splice(idx,1); else items[idx].qty=qty;
    this.save(items);
  },
  badge() {
    const n=this.count();
    document.querySelectorAll('.cart-count').forEach(b=>{
      b.textContent=n; b.style.display=n>0?'flex':'none';
    });
  }
};

// ── Wishlist ─────────────────────────────────────────
const WL = {
  _k:'aq_wish',
  get()  { try{return JSON.parse(localStorage.getItem(this._k)||'[]');}catch{return[];} },
  has(id){ return this.get().includes(Number(id)); },
  toggle(id) {
    let w=this.get(); const n=Number(id);
    w=w.includes(n)?w.filter(i=>i!==n):[...w,n];
    localStorage.setItem(this._k,JSON.stringify(w));
    return w.includes(n);
  }
};

// ── Format ───────────────────────────────────────────
const fmt = {
  price: n=>'₹'+Number(n||0).toLocaleString('en-IN'),
  date:  d=>new Date(d).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}),
  short: d=>new Date(d).toLocaleDateString('en-IN',{day:'numeric',month:'short'}),
  stars: r=>{
    const full=Math.floor(r), half=r%1>=.5?1:0, empty=5-full-half;
    return '★'.repeat(full)+(half?'½':'')+'☆'.repeat(empty);
  }
};

// ── Toast ─────────────────────────────────────────────
function toast(msg) {
  let t=document.getElementById('aq-toast');
  if(!t){ t=document.createElement('div'); t.id='aq-toast'; document.body.appendChild(t); }
  t.textContent=msg; t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 2800);
}

// ── DB helpers ────────────────────────────────────────
const DB = {
  async cats()        { const {data}=await sb.from('categories').select('*,subcategories(*)').eq('active',true).order('sort_order'); return data||[]; },
  async bestsellers(n=8){ const {data}=await sb.from('products').select('*,categories(name,slug)').eq('active',true).order('sales_count',{ascending:false}).limit(n); return data||[]; },
  async latest(n=8)   { const {data}=await sb.from('products').select('*,categories(name,slug)').eq('active',true).order('created_at',{ascending:false}).limit(n); return data||[]; },
  async product(id)   { const {data}=await sb.from('products').select('*,categories(name,slug)').eq('id',id).single(); return data; },
  async related(slug,xid,n=4){ const {data}=await sb.from('products').select('*,categories(name,slug)').eq('category_slug',slug).eq('active',true).neq('id',xid).limit(n); return data||[]; }
};

// ── Scroll reveal ─────────────────────────────────────
function initReveal() {
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if(e.isIntersecting) e.target.classList.add('in'); });
  },{threshold:.1,rootMargin:'0px 0px -40px 0px'});
  document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
}

// ── Navbar scroll effect ──────────────────────────────
function initNavScroll() {
  const nav=document.querySelector('.navbar');
  if(!nav)return;
  window.addEventListener('scroll',()=>{
    nav.classList.toggle('nav-scrolled', window.scrollY>20);
  },{passive:true});
}

document.addEventListener('DOMContentLoaded',()=>{ Cart.badge(); initNavScroll(); });
