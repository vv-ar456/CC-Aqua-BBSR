// =============================================
// AQUANICS — Core Config & Utilities
// =============================================

const SUPABASE_URL = 'https://dwfbqgkhefdzljewatvx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3ZmJxZ2toZWZkemxqZXdhdHZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0NDQ3NjYsImV4cCI6MjA5MTAyMDc2Nn0.tiZ7786a6J41geK9HZs-nFMe00cPlXDX1ptYQ-EQ1B4';
const RAZORPAY_KEY = 'rzp_live_SSegtOEGykPOUN';
const TWOFACTOR_API_KEY = '2503bcf6-237e-11f1-bcb0-0200cd936042';

const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// =============================================
// AUTH — ALL user data lives in Supabase only.
// No passwords ever stored anywhere.
// Login = phone OTP only.
// Session token stored in Supabase `sessions` table.
// =============================================
const Auth = {
  _key: 'aq_sess_token',

  setSession(user, token) {
    localStorage.setItem(this._key, JSON.stringify({ user, token }));
  },
  getSession() {
    try { return JSON.parse(localStorage.getItem(this._key)); } catch { return null; }
  },
  clearSession() { localStorage.removeItem(this._key); },
  isLoggedIn()   { return !!this.getSession(); },
  getUser()      { return this.getSession()?.user || null; },

  async logout() {
    const sess = this.getSession();
    if (sess?.token) {
      await sb.from('sessions').delete().eq('token', sess.token).catch(() => {});
    }
    this.clearSession();
    window.location.href = '/index.html';
  },

  requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
    }
  },

  // Call on sensitive pages to verify token is still valid in DB
  async validateToken() {
    const sess = this.getSession();
    if (!sess?.token) return false;
    const { data } = await sb.from('sessions')
      .select('user_id, expires_at')
      .eq('token', sess.token)
      .single();
    if (!data) { this.clearSession(); return false; }
    if (new Date(data.expires_at) < new Date()) {
      await sb.from('sessions').delete().eq('token', sess.token);
      this.clearSession();
      return false;
    }
    return true;
  }
};

// =============================================
// OTP via 2Factor.in
// =============================================
const OTP = {
  async send(phone) {
    const res = await fetch(
      `https://2factor.in/API/V1/${TWOFACTOR_API_KEY}/SMS/+91${phone}/AUTOGEN/OTP1`
    );
    const data = await res.json();
    if (data.Status !== 'Success') throw new Error(data.Details || 'Failed to send OTP');
    return data.Details;
  },
  async verify(sessionId, otp) {
    const res = await fetch(
      `https://2factor.in/API/V1/${TWOFACTOR_API_KEY}/SMS/VERIFY/${sessionId}/${otp}`
    );
    const data = await res.json();
    if (data.Status !== 'Success') throw new Error('Invalid OTP');
    return true;
  }
};

// =============================================
// CART (localStorage)
// =============================================
const Cart = {
  _key: 'aq_cart',
  get()  { try { return JSON.parse(localStorage.getItem(this._key) || '[]'); } catch { return []; } },
  save(items) { localStorage.setItem(this._key, JSON.stringify(items)); this.updateBadge(); },
  clear()     { localStorage.removeItem(this._key); this.updateBadge(); },
  total()     { return this.get().reduce((s, i) => s + i.price * i.qty, 0); },
  count()     { return this.get().reduce((s, i) => s + i.qty, 0); },

  add(product, qty = 1) {
    const items = this.get();
    const idx = items.findIndex(i => i.id === product.id);
    if (idx > -1) items[idx].qty += qty;
    else items.push({ id: product.id, name: product.name, price: product.price, image_url: product.image_url || '', qty });
    this.save(items);
    this._toast(product.name + ' added to cart!');
  },

  remove(id) { this.save(this.get().filter(i => i.id !== id)); },

  updateQty(id, qty) {
    const items = this.get();
    const idx = items.findIndex(i => i.id === id);
    if (idx < 0) return;
    if (qty <= 0) items.splice(idx, 1); else items[idx].qty = qty;
    this.save(items);
  },

  updateBadge() {
    const n = this.count();
    document.querySelectorAll('.cart-badge').forEach(b => {
      b.textContent = n;
      b.style.display = n > 0 ? 'flex' : 'none';
    });
  },

  _toast(msg) {
    let t = document.getElementById('aq-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'aq-toast';
      t.style.cssText = 'position:fixed;bottom:88px;right:24px;background:#1a7a6e;color:#fff;padding:12px 20px;border-radius:10px;font-size:14px;z-index:9999;transform:translateY(80px);transition:transform 0.3s ease;font-family:inherit;box-shadow:0 4px 20px rgba(0,0,0,0.25);';
      document.body.appendChild(t);
    }
    t.textContent = '🛒 ' + msg;
    t.style.transform = 'translateY(0)';
    setTimeout(() => t.style.transform = 'translateY(80px)', 2600);
  }
};

// =============================================
// WISHLIST (localStorage — IDs only)
// =============================================
const Wishlist = {
  _key: 'aq_wish',
  get()    { try { return JSON.parse(localStorage.getItem(this._key) || '[]'); } catch { return []; } },
  has(id)  { return this.get().includes(Number(id)); },
  toggle(id) {
    let w = this.get(); const n = Number(id);
    w = w.includes(n) ? w.filter(i => i !== n) : [...w, n];
    localStorage.setItem(this._key, JSON.stringify(w));
    this._refreshBtns();
    return w.includes(n);
  },
  _refreshBtns() {
    document.querySelectorAll('[data-wish-id]').forEach(btn => {
      btn.classList.toggle('wished', this.has(btn.dataset.wishId));
    });
  }
};

// =============================================
// PRODUCTS helpers
// =============================================
const Products = {
  async getBestsellers(limit = 8) {
    const { data, error } = await sb.from('products').select('*, categories(name,slug)').eq('active', true).order('sales_count', { ascending: false }).limit(limit);
    if (error) throw error; return data || [];
  },
  async getLatest(limit = 8) {
    const { data, error } = await sb.from('products').select('*, categories(name,slug)').eq('active', true).order('created_at', { ascending: false }).limit(limit);
    if (error) throw error; return data || [];
  },
  async getById(id) {
    const { data, error } = await sb.from('products').select('*, categories(name,slug)').eq('id', id).single();
    if (error) throw error; return data;
  },
  async getRelated(categorySlug, excludeId, limit = 4) {
    const { data } = await sb.from('products').select('*, categories(name,slug)').eq('category_slug', categorySlug).eq('active', true).neq('id', excludeId).limit(limit);
    return data || [];
  }
};

const Categories = {
  async getAll() {
    const { data, error } = await sb.from('categories').select('*, subcategories(*)').eq('active', true).order('sort_order');
    if (error) throw error; return data || [];
  }
};

// =============================================
// FORMAT helpers
// =============================================
const fmt = {
  price: n => '₹' + Number(n || 0).toLocaleString('en-IN'),
  date:  d => new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }),
  short: d => new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short' }),
};

document.addEventListener('DOMContentLoaded', () => Cart.updateBadge());
