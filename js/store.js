/* ============================================
   VYRON — Core Store Logic
   Cart, Favorites, Auth, Orders, Products
   ============================================ */

const Store = (() => {
  const LS = {
    cart: 'vyron_cart',
    favs: 'vyron_favs',
    user: 'vyron_user',
    users: 'vyron_users',
    orders: 'vyron_orders',
    products: 'vyron_products',
    promos: 'vyron_promos',
  };

  /* ---- Storage helpers ---- */
  const get = (k, d = []) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
  const set = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  /* ---- Products ---- */
  function getProducts() {
    const custom = get(LS.products, null);
    if (custom && custom.length) return custom;
    return PRODUCTS;
  }
  function saveProducts(arr) { set(LS.products, arr); }
  function getProduct(id) { return getProducts().find(p => p.id === Number(id)); }

  function addProduct(p) {
    const list = getProducts();
    p.id = list.length ? Math.max(...list.map(x => x.id)) + 1 : 1;
    list.push(p);
    saveProducts(list);
    return p;
  }
  function updateProduct(id, data) {
    const list = getProducts();
    const i = list.findIndex(p => p.id === Number(id));
    if (i >= 0) { list[i] = { ...list[i], ...data, id: Number(id) }; saveProducts(list); return list[i]; }
  }
  function deleteProduct(id) {
    const list = getProducts().filter(p => p.id !== Number(id));
    saveProducts(list);
  }

  /* ---- Cart ---- */
  function getCart() { return get(LS.cart, []); }
  function saveCart(c) { set(LS.cart, c); updateBadges(); }
  function cartCount() { return getCart().reduce((s, i) => s + i.qty, 0); }
  function cartTotal() {
    return getCart().reduce((s, i) => {
      const p = getProduct(i.id);
      return p ? s + p.price * i.qty : s;
    }, 0);
  }
  function addToCart(id, size, color, qty = 1) {
    const cart = getCart();
    const key = `${id}-${size}-${color}`;
    const ex = cart.find(i => `${i.id}-${i.size}-${i.color}` === key);
    if (ex) ex.qty += qty;
    else cart.push({ id: Number(id), size, color, qty });
    saveCart(cart);
    toast('Товар добавлен в корзину', 'success');
  }
  function removeFromCart(idx) {
    const cart = getCart();
    cart.splice(idx, 1);
    saveCart(cart);
  }
  function updateQty(idx, qty) {
    const cart = getCart();
    if (cart[idx]) { cart[idx].qty = Math.max(1, qty); saveCart(cart); }
  }
  function clearCart() { localStorage.removeItem(LS.cart); updateBadges(); }

  /* ---- Favorites ---- */
  function getFavs() { return get(LS.favs, []); }
  function toggleFav(id) {
    const favs = getFavs();
    id = Number(id);
    if (favs.includes(id)) { favs.splice(favs.indexOf(id), 1); toast('Убрано из избранного'); }
    else { favs.push(id); toast('Добавлено в избранное', 'success'); }
    set(LS.favs, favs);
    updateBadges();
    return favs.includes(id);
  }
  function isFav(id) { return getFavs().includes(Number(id)); }

  /* ---- Auth ---- */
  function getUsers() { return get(LS.users, []); }
  function register(name, email, pass) {
    const users = getUsers();
    if (users.find(u => u.email === email)) throw new Error('Пользователь с таким email уже зарегистрирован');
    const u = { id: Date.now(), name, email, pass, phone: '', address: '', city: '', createdAt: new Date().toISOString() };
    users.push(u);
    set(LS.users, users);
    set(LS.user, { id: u.id, name: u.name, email: u.email });
    toast('Регистрация успешна! Добро пожаловать, ' + name, 'success');
    return u;
  }
  function login(email, pass) {
    const u = getUsers().find(x => x.email === email && x.pass === pass);
    if (!u) throw new Error('Неверный email или пароль');
    set(LS.user, { id: u.id, name: u.name, email: u.email });
    toast('Вход выполнен. Привет, ' + u.name + '!', 'success');
    return u;
  }
  function logout() { localStorage.removeItem(LS.user); toast('Вы вышли из аккаунта'); }
  function currentUser() { return get(LS.user, null); }
  function isLoggedIn() { return !!currentUser(); }
  function updateProfile(data) {
    const users = getUsers();
    const cu = currentUser();
    if (!cu) return;
    const u = users.find(x => x.id === cu.id);
    if (u) { Object.assign(u, data); set(LS.users, users); }
    const sess = { ...cu, ...data };
    set(LS.user, sess);
    toast('Профиль обновлён', 'success');
  }

  /* ---- Orders ---- */
  function getOrders() {
    const cu = currentUser();
    if (!cu) return [];
    return get(LS.orders, []).filter(o => o.userId === cu.id);
  }
  function getAllOrders() { return get(LS.orders, []); }
  function createOrder(info, promo) {
    const cu = currentUser();
    const cart = getCart();
    if (!cart.length) throw new Error('Корзина пуста');
    const items = cart.map(i => {
      const p = getProduct(i.id);
      return { id: i.id, name: p.name, price: p.price, image: p.image, size: i.size, color: i.color, qty: i.qty };
    });
    let total = items.reduce((s, i) => s + i.price * i.qty, 0);
    let discount = 0;
    if (promo) {
      if (promo.type === 'percent') discount = Math.round(total * promo.discount / 100);
      else discount = promo.discount;
    }
    const order = {
      id: Date.now(),
      userId: cu ? cu.id : null,
      items, total: total - discount, discount,
      ...info,
      promoCode: promo ? promo.code : null,
      status: 'new',
      date: new Date().toISOString(),
    };
    const orders = get(LS.orders, []);
    orders.push(order);
    set(LS.orders, orders);
    clearCart();
    toast('Заказ оформлен! Номер ' + order.id, 'success');
    return order;
  }

  /* ---- Promo codes ---- */
  function getPromos() { return get(LS.promos, PROMO_CODES); }
  function validatePromo(code, total) {
    code = code.trim().toUpperCase();
    const promo = getPromos().find(p => p.code.toUpperCase() === code);
    if (!promo) return { ok: false, msg: 'Промокод не найден' };
    if (promo.minOrder && total < promo.minOrder) return { ok: false, msg: `Минимальный заказ ${promo.minOrder} ₽` };
    return { ok: true, promo };
  }

  /* ---- Filtering / Sorting ---- */
  function filterProducts(opts = {}) {
    let list = getProducts();
    if (opts.category && opts.category !== 'all') list = list.filter(p => p.category === opts.category);
    if (opts.subcategory) list = list.filter(p => p.subcategory === opts.subcategory);
    if (opts.search) {
      const q = opts.search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.category.includes(q));
    }
    if (opts.sizes && opts.sizes.length) list = list.filter(p => p.sizes.some(s => opts.sizes.includes(String(s))));
    if (opts.colors && opts.colors.length) list = list.filter(p => p.colors.some(c => opts.colors.includes(c.name)));
    if (opts.minPrice != null) list = list.filter(p => p.price >= opts.minPrice);
    if (opts.maxPrice != null) list = list.filter(p => p.price <= opts.maxPrice);
    if (opts.onlyDiscount) list = list.filter(p => p.oldPrice && p.oldPrice > p.price);
    if (opts.onlyNew) list = list.filter(p => p.isNew);
    if (opts.onlyHit) list = list.filter(p => p.isHit);
    // Sort
    const sort = opts.sort || 'default';
    switch (sort) {
      case 'price-asc': list.sort((a, b) => a.price - b.price); break;
      case 'price-desc': list.sort((a, b) => b.price - a.price); break;
      case 'rating': list.sort((a, b) => b.rating - a.rating); break;
      case 'new': list.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0)); break;
      case 'discount': list.sort((a, b) => (b.discount || 0) - (a.discount || 0)); break;
    }
    return list;
  }

  /* ---- UI Helpers ---- */
  function fmtPrice(n) { return n.toLocaleString('ru-RU') + ' ₽'; }
  function stars(r) { return '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r)); }

  function toast(msg, type = '') {
    let el = document.querySelector('.toast');
    if (!el) { el = document.createElement('div'); el.className = 'toast'; document.body.appendChild(el); }
    const item = document.createElement('div');
    item.className = 'toast__item' + (type ? ' toast__item--' + type : '');
    item.textContent = msg;
    el.appendChild(item);
    setTimeout(() => { item.classList.add('hide'); setTimeout(() => item.remove(), 300); }, 2600);
  }

  function updateBadges() {
    const cb = document.getElementById('cart-badge');
    const fb = document.getElementById('fav-badge');
    const cc = cartCount(), fc = getFavs().length;
    if (cb) { cb.textContent = cc; cb.classList.toggle('hide', cc === 0); }
    if (fb) { fb.textContent = fc; fb.classList.toggle('hide', fc === 0); }
  }

  function productCard(p) {
    const fav = isFav(p.id) ? 'active' : '';
    const favIcon = `<svg viewBox="0 0 24 24" fill="${isFav(p.id) ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
    const badges = [];
    if (p.isNew) badges.push('<span class="badge badge--new">New</span>');
    if (p.discount) badges.push(`<span class="badge badge--sale">-${p.discount}%</span>`);
    if (p.isHit && !p.isNew) badges.push('<span class="badge badge--hit">Хит</span>');
    const oldPrice = p.oldPrice ? `<span class="product-card__old-price">${fmtPrice(p.oldPrice)}</span>` : '';
    const catName = CATEGORIES.find(c => c.id === p.category)?.name || '';
    return `
      <div class="product-card" data-id="${p.id}">
        <div class="product-card__img-wrap">
          <div class="product-card__badges">${badges.join('')}</div>
          <button class="product-card__fav ${fav}" onclick="Store.toggleFav(${p.id});window.renderCards&&renderCards()">${favIcon}</button>
          <a href="product.html?id=${p.id}"><img class="product-card__img" src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22400%22><rect width=%22400%22 height=%22400%22 fill=%22%23f5f5f5%22/><text x=%2250%25%22 y=%2250%25%22 fill=%22%23999%22 font-size=%2218%22>Нет фото</text></svg>'"></a>
        </div>
        <div class="product-card__body">
          <div class="product-card__cat">${catName}</div>
          <h3 class="product-card__name"><a href="product.html?id=${p.id}">${p.name}</a></h3>
          <div class="product-card__rating"><span class="stars">${stars(p.rating)}</span> ${p.rating} (${p.reviews})</div>
          <div class="product-card__price-row">
            <span class="product-card__price">${fmtPrice(p.price)}</span>
            ${oldPrice}
          </div>
          <button class="product-card__add" onclick="Store.quickAdd(${p.id})">В корзину</button>
        </div>
      </div>`;
  }

  // Quick add to cart (first size, first color)
  function quickAdd(id) {
    const p = getProduct(id);
    if (!p) return;
    const size = p.sizes[0];
    const color = p.colors[0]?.name || '';
    addToCart(id, size, color, 1);
  }

  // Render header (shared across pages)
  function renderHeader(active) {
    const nav = ['index', 'catalog', ''].includes(active);
    return `
    <header class="header">
      <div class="container header__inner">
        <a href="index.html" class="logo">VY<span>RON</span></a>
        <nav class="header__nav">
          <a href="index.html" class="${active==='index'?'active':''}">Главная</a>
          <a href="catalog.html" class="${active==='catalog'?'active':''}">Каталог</a>
          <a href="catalog.html?category=footwear">Обувь</a>
          <a href="catalog.html?category=clothing">Одежда</a>
          <a href="catalog.html?category=accessories">Аксессуары</a>
          <a href="catalog.html?category=equipment">Инвентарь</a>
          <a href="account.html" class="${active==='account'?'active':''}">Аккаунт</a>
        </nav>
        <div class="header__search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input type="text" placeholder="Поиск товаров..." id="header-search" onkeydown="if(event.key==='Enter'){window.location.href='catalog.html?search='+this.value}">
        </div>
        <div class="header__actions">
          <a href="favorites.html" class="icon-btn" title="Избранное">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            <span class="icon-btn__badge hide" id="fav-badge">0</span>
          </a>
          <a href="cart.html" class="icon-btn" title="Корзина">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            <span class="icon-btn__badge hide" id="cart-badge">0</span>
          </a>
          <a href="account.html" class="icon-btn" title="Аккаунт">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </a>
          <button class="icon-btn header__toggle" onclick="document.querySelector('.mobile-nav').classList.add('open');document.querySelector('.overlay').classList.add('show')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
        </div>
      </div>
    </header>
    <div class="mobile-nav" id="mobile-nav">
      <button class="mobile-nav__close" onclick="document.querySelector('.mobile-nav').classList.remove('open');document.querySelector('.overlay').classList.remove('show')">&times;</button>
      <a href="index.html">Главная</a>
      <a href="catalog.html">Каталог</a>
      <a href="catalog.html?category=footwear">Обувь</a>
      <a href="catalog.html?category=clothing">Одежда</a>
      <a href="catalog.html?category=accessories">Аксессуары</a>
      <a href="catalog.html?category=equipment">Спортинвентарь</a>
      <a href="favorites.html">Избранное</a>
      <a href="cart.html">Корзина</a>
      <a href="account.html">Аккаунт</a>
      <a href="admin.html">Админ-панель</a>
    </div>
    <div class="overlay" onclick="document.querySelector('.mobile-nav').classList.remove('open');this.classList.remove('show')"></div>`;
  }

  function renderFooter() {
    return `
    <footer class="footer">
      <div class="container">
        <div class="footer__grid">
          <div class="footer__brand">
            <div class="logo">VY<span>RON</span></div>
            <p>Премиальный магазин спортивных товаров. Качество, стиль, технологии — всё для вашего спорта.</p>
            <div class="footer__social">
              <a href="#" aria-label="VK"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.79 17.5c-5.16 0-8.1-3.54-8.22-9.41h2.59c.09 4.31 1.99 6.14 3.5 6.52V8.09h2.44v3.71c1.49-.16 3.05-1.87 3.58-3.71h2.44c-.41 2.28-2.1 3.99-3.31 4.69 1.21.57 3.13 2.05 3.86 4.72h-2.68c-.57-1.79-2-3.17-4.19-3.35v3.35z"/></svg></a>
              <a href="#" aria-label="Telegram"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.94 14.86 9.6 17.2c-.27.27-.55.4-.9.36-.36-.04-.5-.2-.55-.56l-.34-2.25 5.86-5.28c.26-.24.26-.48-.02-.68-.28-.2-.55-.17-.82.07L6.74 12.8l-2.92-.92c-.62-.19-.63-.57-.13-.93L16.7 5.9c.52-.23 1.02-.18 1.3.42.2.42.08 1.9-.35 4.46-.5 3-1.14 6.3-1.4 7.54-.25 1.17-.95 1.3-1.9.63z"/></svg></a>
              <a href="#" aria-label="Instagram"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg></a>
              <a href="#" aria-label="YouTube"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M23 12s0-3.5-.45-5.2a2.8 2.8 0 0 0-1.95-2C18.88 4.3 12 4.3 12 4.3s-6.88 0-8.6.5a2.8 2.8 0 0 0-1.95 2C1 8.5 1 12 1 12s0 3.5.45 5.2a2.8 2.8 0 0 0 1.95 2c1.72.5 8.6.5 8.6.5s6.88 0 8.6-.5a2.8 2.8 0 0 0 1.95-2C23 15.5 23 12 23 12zM9.75 15.5v-7l6 3.5z"/></svg></a>
            </div>
          </div>
          <div class="footer__col">
            <h4>Магазин</h4>
            <a href="catalog.html?category=footwear">Обувь</a>
            <a href="catalog.html?category=clothing">Одежда</a>
            <a href="catalog.html?category=accessories">Аксессуары</a>
            <a href="catalog.html?category=equipment">Спортинвентарь</a>
            <a href="catalog.html?onlyDiscount=1">Скидки</a>
          </div>
          <div class="footer__col">
            <h4>Информация</h4>
            <a href="#">Доставка и оплата</a>
            <a href="#">Возврат и обмен</a>
            <a href="#">Размерная сетка</a>
            <a href="#">Программа лояльности</a>
            <a href="#">FAQ</a>
          </div>
          <div class="footer__col">
            <h4>Компания</h4>
            <a href="#">О нас</a>
            <a href="#">Магазины</a>
            <a href="#">Карьера</a>
            <a href="#">Контакты</a>
            <a href="admin.html">Админ-панель</a>
          </div>
        </div>
        <div class="footer__bottom">
          <p>© 2026 VYRON. Все права защищены. Спортивные товары премиум-класса.</p>
        </div>
      </div>
    </footer>`;
  }

  // Initialize page (call on every page load)
  function initPage(activeNav) {
    const h = document.getElementById('header');
    const f = document.getElementById('footer');
    if (h) h.innerHTML = renderHeader(activeNav);
    if (f) f.innerHTML = renderFooter();
    updateBadges();
  }

  return {
    getProducts, getProduct, addProduct, updateProduct, deleteProduct, saveProducts,
    getCart, cartCount, cartTotal, addToCart, removeFromCart, updateQty, clearCart,
    getFavs, toggleFav, isFav,
    register, login, logout, currentUser, isLoggedIn, updateProfile, getUsers,
    getOrders, getAllOrders, createOrder,
    getPromos, validatePromo,
    filterProducts,
    fmtPrice, stars, toast, updateBadges, productCard, quickAdd,
    initPage, renderHeader, renderFooter,
    CATEGORIES, PROMO_CODES,
  };
})();
