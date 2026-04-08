// ── Shared UI Components ──────────────────────────────

const UI = {

  // ── Render Navbar ──────────────────────────────────
  nav: async (activeCat='') => {
    const el = document.getElementById('navbar');
    if(!el) return;
    const user = Auth.getUser();
    let cats=[];
    try { cats = await DB.cats(); } catch(e){}

    const catHtml = cats.map(c=>`
      <li class="${activeCat===c.slug?'active':''}">
        <a href="/products.html?cat=${c.slug}">${c.emoji||''} ${c.name}</a>
        ${c.subcategories?.length?`
          <div class="nav-dropdown">
            ${c.subcategories.map(s=>`<a href="/products.html?cat=${c.slug}&sub=${s.slug}">↳ ${s.name}</a>`).join('')}
          </div>`:''}`
    ).join('</li><li>') + '</li>';

    el.innerHTML=`
    <div class="navbar">
      <div class="nav-inner">
        <a href="/index.html" class="nav-logo"><img src="/logo.png" alt="Aquanics"></a>
        <div class="nav-search">
          <input id="ns-input" type="text" placeholder="Search fish, aquariums, pets…"
            onkeydown="if(event.key==='Enter')UI.search()">
          <button class="nav-search-btn" onclick="UI.search()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </button>
        </div>
        <div class="nav-actions">
          ${user?`
            <button class="nav-icon-btn" onclick="location.href='/account.html'">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <span>${(user.name||'').split(' ')[0]}</span>
            </button>`:
            `<button class="nav-icon-btn" onclick="location.href='/login.html'">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <span>Login</span>
            </button>`}
          <button class="nav-icon-btn" onclick="location.href='/wishlist.html'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            <span>Wishlist</span>
          </button>
          <button class="nav-icon-btn" onclick="location.href='/cart.html'" style="position:relative">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            <span class="nav-badge cart-count" style="display:none">0</span>
            <span>Cart</span>
          </button>
        </div>
      </div>
      <nav class="nav-cats-bar">
        <ul class="nav-cats-inner">
          <li class="${!activeCat?'active':''}"><a href="/index.html">🏠 Home</a></li>
          ${catHtml}
          <li><a href="/contact.html">📞 Contact</a></li>
        </ul>
      </nav>
    </div>`;
    Cart.badge();
    initNavScroll();
  },

  // ── Render Footer ──────────────────────────────────
  footer: () => {
    const el=document.getElementById('footer');
    if(!el)return;
    el.innerHTML=`
    <footer class="footer">
      <div class="footer-top">
        <div class="footer-brand">
          <img src="/logo.png" alt="Aquanics">
          <p>Your trusted destination for premium aquarium fish, birds, pets and all their supplies. Quality assured, ethically sourced.</p>
          <div class="footer-social">
            <a href="#" title="Facebook">📘</a>
            <a href="#" title="Instagram">📷</a>
            <a href="#" title="YouTube">▶️</a>
            <a href="https://wa.me/919999999999" title="WhatsApp">💬</a>
          </div>
        </div>
        <div class="footer-col"><h4>Quick Links</h4>
          <ul>
            <li><a href="/index.html">Home</a></li>
            <li><a href="/products.html">All Products</a></li>
            <li><a href="/contact.html">Contact Us</a></li>
            <li><a href="/policies.html#doa">DOA Policy</a></li>
          </ul>
        </div>
        <div class="footer-col"><h4>Customer Service</h4>
          <ul>
            <li><a href="/account.html">My Orders</a></li>
            <li><a href="/policies.html#returns">Returns</a></li>
            <li><a href="/policies.html#shipping">Shipping</a></li>
            <li><a href="/policies.html#privacy">Privacy Policy</a></li>
          </ul>
        </div>
        <div class="footer-col"><h4>Get in Touch</h4>
          <ul>
            <li><a href="tel:+91XXXXXXXXXX">📞 +91-XXXX-XXXXXX</a></li>
            <li><a href="mailto:support@aquanics.in">✉️ support@aquanics.in</a></li>
            <li><a href="https://wa.me/919999999999">💬 WhatsApp Chat</a></li>
            <li><a href="#">📍 Bhubaneswar, Odisha</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        © ${new Date().getFullYear()} Aquanics by Coreconics · All rights reserved · Powered by Razorpay & Supabase
      </div>
    </footer>`;
  },

  search: () => {
    const q=document.getElementById('ns-input')?.value?.trim();
    if(q) location.href='/products.html?search='+encodeURIComponent(q);
  },

  // ── Product Card ───────────────────────────────────
  card: (p) => {
    const disc = p.mrp&&p.mrp>p.price ? Math.round((1-p.price/p.mrp)*100) : 0;
    const w    = WL.has(p.id);
    const img  = p.image_url||'';
    const fallback = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><rect width='200' height='200' fill='%23e4eeec'/><text x='50%25' y='50%25' font-size='48' text-anchor='middle' dominant-baseline='middle'>🐠</text></svg>`;
    return `
    <div class="product-card">
      ${p.featured?`<span class="product-card-tag">Featured</span>`:''}
      ${disc?`<span class="product-card-tag sale" style="${p.featured?'top:40px':''}">${disc}% OFF</span>`:''}
      <a href="/product.html?id=${p.id}" class="product-card-img">
        <img src="${img}" onerror="this.src='${fallback}'" alt="${p.name}" loading="lazy">
        <button class="product-card-wish${w?' wished':''}"
          onclick="event.preventDefault();event.stopPropagation();doWish(${p.id},this)"
          aria-label="Wishlist">
          <svg viewBox="0 0 24 24" width="16" height="16"
            fill="${w?'#ee0055':'none'}" stroke="${w?'#ee0055':'currentColor'}" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
        <div class="product-card-quick">
          <button class="quick-btn quick-cart" onclick="event.preventDefault();doCart(${p.id},'${esc(p.name)}',${p.price},'${esc(img)}')">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            Add to Cart
          </button>
          <a href="/product.html?id=${p.id}" class="quick-btn quick-view">View</a>
        </div>
      </a>
      <div class="product-card-body">
        <span class="product-card-cat">${p.categories?.name||''}</span>
        <a href="/product.html?id=${p.id}" class="product-card-name">${p.name}</a>
        <div class="product-card-stars">
          <span>${fmt.stars(p.rating||4.5)}</span>
          <span>(${p.review_count||0})</span>
        </div>
        <div class="product-card-price">
          <strong>${fmt.price(p.price)}</strong>
          ${p.mrp&&p.mrp>p.price?`<del>${fmt.price(p.mrp)}</del>`:''}
        </div>
      </div>
    </div>`;
  },

  skels: (n=8) => Array(n).fill('<div class="skeleton skel-card"></div>').join('')
};

// ── Helpers ────────────────────────────────────────────
function esc(s){ return String(s||'').replace(/'/g,"\\'").replace(/"/g,'&quot;'); }

function doCart(id,name,price,img) {
  Cart.add({id,name,price,image_url:img});
}

function doWish(id,btn) {
  const now = WL.toggle(id);
  btn.classList.toggle('wished',now);
  const svg=btn.querySelector('svg');
  if(svg){ svg.setAttribute('fill',now?'#ee0055':'none'); svg.setAttribute('stroke',now?'#ee0055':'currentColor'); }
}
