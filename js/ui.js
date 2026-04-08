// =============================================
// AQUANICS — Shared UI: navbar, footer, cards
// =============================================

const UI = {

  // ── Navbar ────────────────────────────────
  renderNav: async (activeCat = '') => {
    const navEl = document.getElementById('navbar');
    if (!navEl) return;

    const user = Auth.getUser();
    let cats = [];
    try { cats = await Categories.getAll(); } catch(e) {}

    const catLinks = cats.map(cat => `
      <li class="${activeCat === cat.slug ? 'active' : ''}">
        <a href="/products.html?cat=${cat.slug}">${cat.emoji || ''} ${cat.name}</a>
        ${cat.subcategories?.length ? `
          <div class="dropdown">
            ${cat.subcategories.map(sub =>
              `<a href="/products.html?cat=${cat.slug}&sub=${sub.slug}">${sub.name}</a>`
            ).join('')}
          </div>` : ''}
      </li>
    `).join('');

    navEl.innerHTML = `
      <div class="nav-top">
        <a href="/index.html" class="nav-logo">
          <img src="/logo.png" alt="Aquanics">
        </a>
        <div class="nav-search">
          <input type="text" id="nav-search-input" placeholder="Search for fish, aquariums, pet supplies…"
            onkeydown="if(event.key==='Enter') UI.doSearch()">
          <button class="nav-search-btn" onclick="UI.doSearch()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </button>
        </div>
        <div class="nav-actions">
          ${user ? `
            <button class="nav-btn" onclick="location.href='/account.html'">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <span>${(user.name || 'Account').split(' ')[0]}</span>
            </button>
          ` : `
            <button class="nav-btn" onclick="location.href='/login.html'">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <span>Login</span>
            </button>
          `}
          <button class="nav-btn" onclick="location.href='/wishlist.html'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <span>Wishlist</span>
          </button>
          <button class="nav-btn" onclick="location.href='/cart.html'" style="position:relative">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            <span class="cart-badge" style="display:none">0</span>
            <span>Cart</span>
          </button>
        </div>
      </div>
      <nav class="nav-bottom">
        <ul class="nav-cats">
          <li ${!activeCat ? 'class="active"' : ''}>
            <a href="/index.html">Home</a>
          </li>
          ${catLinks}
          <li><a href="/contact.html">Contact</a></li>
        </ul>
      </nav>
    `;

    Cart.updateBadge();
  },

  // ── Footer ────────────────────────────────
  renderFooter: () => {
    const el = document.getElementById('footer');
    if (!el) return;
    el.innerHTML = `
      <div class="footer-main">
        <div class="footer-brand">
          <img src="/logo.png" alt="Aquanics">
          <p>Your trusted destination for premium aquarium fish, birds, pets and all their supplies. Quality assured, ethically sourced.</p>
          <div class="footer-social">
            <a href="#" title="Facebook">📘</a>
            <a href="#" title="Instagram">📷</a>
            <a href="#" title="YouTube">▶️</a>
            <a href="https://wa.me/91XXXXXXXXXX" title="WhatsApp">💬</a>
          </div>
        </div>
        <div class="footer-col">
          <h4>Quick Links</h4>
          <ul>
            <li><a href="/index.html">Home</a></li>
            <li><a href="/products.html">All Products</a></li>
            <li><a href="/contact.html">About & Contact</a></li>
            <li><a href="/policies.html#doa">DOA Policy</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Customer Service</h4>
          <ul>
            <li><a href="/account.html">My Orders</a></li>
            <li><a href="/policies.html#returns">Return Policy</a></li>
            <li><a href="/policies.html#shipping">Shipping Info</a></li>
            <li><a href="/policies.html#privacy">Privacy Policy</a></li>
            <li><a href="/policies.html#terms">Terms of Service</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Contact Us</h4>
          <ul>
            <li><a href="tel:+91XXXXXXXXXX">📞 +91-XXXX-XXXXXX</a></li>
            <li><a href="mailto:support@aquanics.in">✉️ support@aquanics.in</a></li>
            <li><a href="https://wa.me/91XXXXXXXXXX" target="_blank">💬 WhatsApp Chat</a></li>
            <li><a href="#">📍 Bhubaneswar, Odisha</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <p>© ${new Date().getFullYear()} Aquanics by Coreconics. All rights reserved. | Powered by Razorpay & Supabase</p>
      </div>
    `;
  },

  doSearch: () => {
    const q = document.getElementById('nav-search-input')?.value?.trim();
    if (q) window.location.href = `/products.html?search=${encodeURIComponent(q)}`;
  },

  // ── Star renderer ─────────────────────────
  stars: (rating) => {
    const r = Math.round(rating * 2) / 2;
    let s = '';
    for (let i = 1; i <= 5; i++) {
      if (i <= r) s += '★';
      else if (i - 0.5 === r) s += '⯨';
      else s += '☆';
    }
    return s;
  },

  // ── Product card ──────────────────────────
  productCard: (p) => {
    const discount = p.mrp && p.mrp > p.price
      ? Math.round((1 - p.price / p.mrp) * 100) : 0;
    const wished = Wishlist.has(p.id);
    return `
      <div class="product-card">
        ${p.featured ? '<span class="product-card-badge">Featured</span>' : ''}
        ${discount ? `<span class="product-card-badge" style="left:auto;right:10px;background:var(--gold)">${discount}% OFF</span>` : ''}
        <a href="/product.html?id=${p.id}" class="product-card-img">
          <img src="${p.image_url || ''}"
            onerror="this.src='data:image/svg+xml,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'200\\' height=\\'200\\'><rect width=\\'200\\' height=\\'200\\' fill=\\'%23e8f5f2\\'/><text x=\\'50%25\\' y=\\'50%25\\' font-size=\\'40\\' text-anchor=\\'middle\\' dominant-baseline=\\'middle\\'>🐠</text></svg>'"
            alt="${p.name}" loading="lazy">
          <button class="product-card-wish ${wished ? 'wished' : ''}"
            data-wish-id="${p.id}"
            onclick="event.preventDefault();event.stopPropagation();toggleWish(${p.id},this)">
            <svg viewBox="0 0 24 24" width="16" height="16"
              fill="${wished ? '#ee0055' : 'none'}"
              stroke="${wished ? '#ee0055' : 'currentColor'}" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
        </a>
        <div class="product-card-body">
          <span class="product-cat-tag">${p.categories?.name || ''}</span>
          <a href="/product.html?id=${p.id}" class="product-name">${p.name}</a>
          <div class="product-stars">
            <span class="stars">${UI.stars(p.rating || 4.5)}</span>
            <span>(${p.review_count || 0})</span>
          </div>
          <div class="product-price">
            ${fmt.price(p.price)}
            ${p.mrp && p.mrp > p.price ? `<del>${fmt.price(p.mrp)}</del>` : ''}
          </div>
        </div>
        <div class="product-card-footer">
          <button class="btn-cart" onclick="cartAdd(${p.id},'${p.name.replace(/'/g, "\\'")}',${p.price},'${(p.image_url||'').replace(/'/g,"\\'")}')">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            Add to Cart
          </button>
        </div>
      </div>
    `;
  },

  skeletonCards: (n = 8) =>
    Array(n).fill('<div class="skeleton skeleton-card"></div>').join('')
};

// ── Global helpers (called from inline onclick) ──
function cartAdd(id, name, price, image_url) {
  Cart.add({ id, name, price, image_url });
}

function toggleWish(id, btn) {
  const isNow = Wishlist.toggle(id);
  if (btn) {
    btn.classList.toggle('wished', isNow);
    const svg = btn.querySelector('svg');
    if (svg) {
      svg.setAttribute('fill', isNow ? '#ee0055' : 'none');
      svg.setAttribute('stroke', isNow ? '#ee0055' : 'currentColor');
    }
  }
}
