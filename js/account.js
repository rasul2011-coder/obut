/* VYRON — Account Page Logic */

let accountTab = 'profile';

function renderAccount() {
  const el = document.getElementById('account-content');
  const user = Store.currentUser();

  if (!user) {
    el.innerHTML = renderAuthForms();
    bindAuthForms();
    return;
  }

  // Logged in: dashboard
  const u = Store.getUsers().find(x => x.id === user.id) || user;
  el.innerHTML = `
    <div class="account-layout">
      <aside class="account-nav">
        <div class="account-nav__item active" data-tab="profile" onclick="switchAccountTab('profile', this)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          Профиль
        </div>
        <div class="account-nav__item" data-tab="orders" onclick="switchAccountTab('orders', this)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          Мои заказы
        </div>
        <div class="account-nav__item" data-tab="settings" onclick="switchAccountTab('settings', this)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          Настройки
        </div>
        <div class="account-nav__item" onclick="Store.logout();renderAccount()" style="color:var(--danger)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Выйти
        </div>
      </aside>
      <div class="account-content" id="account-tab-content"></div>
    </div>`;
  renderAccountTab(u);
}

function switchAccountTab(tab, el) {
  accountTab = tab;
  document.querySelectorAll('.account-nav__item').forEach(i => i.classList.remove('active'));
  if (el) el.classList.add('active');
  const u = Store.getUsers().find(x => x.id === Store.currentUser().id) || Store.currentUser();
  renderAccountTab(u);
}

function renderAccountTab(u) {
  const el = document.getElementById('account-tab-content');
  if (accountTab === 'profile') {
    el.innerHTML = `
      <h2>Мой профиль</h2>
      <div class="profile-field"><label>Имя и фамилия</label><span>${u.name || '—'}</span></div>
      <div class="profile-field"><label>Email</label><span>${u.email || '—'}</span></div>
      <div class="profile-field"><label>Телефон</label><span>${u.phone || 'Не указан'}</span></div>
      <div class="profile-field"><label>Город</label><span>${u.city || 'Не указан'}</span></div>
      <div class="profile-field"><label>Адрес</label><span>${u.address || 'Не указан'}</span></div>
      <div class="profile-field" style="border:none"><label>Дата регистрации</label><span>${new Date(u.createdAt || Date.now()).toLocaleDateString('ru-RU')}</span></div>`;
  } else if (accountTab === 'orders') {
    const orders = Store.getOrders();
    if (orders.length === 0) {
      el.innerHTML = `
        <h2>Мои заказы</h2>
        <div class="empty-state">
          <div class="empty-state__icon">📦</div>
          <h3 style="margin-bottom:8px">Заказов пока нет</h3>
          <p style="margin-bottom:20px">Ваши заказы появятся здесь после оформления</p>
          <a href="catalog.html" class="btn btn--primary">В каталог</a>
        </div>`;
    } else {
      el.innerHTML = `<h2>Мои заказы (${orders.length})</h2>` + orders.slice().reverse().map(o => `
        <div class="order-card">
          <div class="order-card__header">
            <div class="order-card__num">Заказ #${o.id}</div>
            <div class="order-card__status order-card__status--${o.status}">${o.status === 'new' ? 'Новый' : o.status === 'done' ? 'Выполнен' : 'В обработке'}</div>
          </div>
          <div class="order-card__items">
            ${o.items.map(i => `<img src="${i.image}" alt="${i.name}" title="${i.name}">`).join('')}
          </div>
          <div class="order-card__footer">
            <div style="color:#888;font-size:14px">${new Date(o.date).toLocaleDateString('ru-RU')} · ${o.delivery === 'pickup' ? 'Самовывоз' : o.delivery === 'post' ? 'Почта' : 'Курьер'} · ${o.payment === 'card' ? 'Картой' : o.payment === 'sbp' ? 'СБП' : 'Наличными'}</div>
            <div style="font-family:var(--font-head);font-size:20px;font-weight:700">${Store.fmtPrice(o.total)}</div>
          </div>
        </div>`).join('');
    }
  } else if (accountTab === 'settings') {
    el.innerHTML = `
      <h2>Настройки профиля</h2>
      <form onsubmit="saveProfile(event)">
        <div class="form-group">
          <label>Имя и фамилия</label>
          <input type="text" id="set-name" value="${u.name || ''}">
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" id="set-email" value="${u.email || ''}">
        </div>
        <div class="form-group">
          <label>Телефон</label>
          <input type="tel" id="set-phone" value="${u.phone || ''}" placeholder="+7 (___) ___-__-__">
        </div>
        <div class="form-group">
          <label>Город</label>
          <input type="text" id="set-city" value="${u.city || ''}">
        </div>
        <div class="form-group">
          <label>Адрес</label>
          <textarea id="set-address" rows="2">${u.address || ''}</textarea>
        </div>
        <button type="submit" class="btn btn--primary">Сохранить изменения</button>
      </form>`;
  }
}

function saveProfile(e) {
  e.preventDefault();
  Store.updateProfile({
    name: document.getElementById('set-name').value.trim(),
    email: document.getElementById('set-email').value.trim(),
    phone: document.getElementById('set-phone').value.trim(),
    city: document.getElementById('set-city').value.trim(),
    address: document.getElementById('set-address').value.trim(),
  });
  renderAccount();
}

// Auth forms
function renderAuthForms() {
  return `
    <div class="auth-page">
      <div class="auth-card">
        <h1 style="font-size:2rem;text-align:center">VY<span style="color:var(--orange)">RON</span></h1>
        <p>Войдите или зарегистрируйтесь, чтобы продолжить</p>
        <div class="auth-tabs">
          <div class="auth-tab active" onclick="switchAuthTab('login', this)">Вход</div>
          <div class="auth-tab" onclick="switchAuthTab('register', this)">Регистрация</div>
        </div>
        <form id="login-form" onsubmit="doLogin(event)">
          <div class="form-group">
            <label>Email</label>
            <input type="email" id="login-email" required placeholder="example@mail.ru">
          </div>
          <div class="form-group">
            <label>Пароль</label>
            <input type="password" id="login-pass" required placeholder="••••••••">
          </div>
          <button type="submit" class="btn btn--primary btn--block">Войти</button>
        </form>
        <form id="register-form" onsubmit="doRegister(event)" style="display:none">
          <div class="form-group">
            <label>Имя и фамилия</label>
            <input type="text" id="reg-name" required placeholder="Иван Иванов">
          </div>
          <div class="form-group">
            <label>Email</label>
            <input type="email" id="reg-email" required placeholder="example@mail.ru">
          </div>
          <div class="form-group">
            <label>Пароль</label>
            <input type="password" id="reg-pass" required placeholder="Минимум 6 символов" minlength="6">
          </div>
          <div class="form-group">
            <label>Подтвердите пароль</label>
            <input type="password" id="reg-pass2" required placeholder="••••••••">
          </div>
          <button type="submit" class="btn btn--primary btn--block">Зарегистрироваться</button>
        </form>
      </div>
    </div>`;
}

function bindAuthForms() {
  // forms are handled by inline onsubmit
}

function switchAuthTab(tab, el) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('login-form').style.display = tab === 'login' ? '' : 'none';
  document.getElementById('register-form').style.display = tab === 'register' ? '' : 'none';
}

function doLogin(e) {
  e.preventDefault();
  try {
    Store.login(document.getElementById('login-email').value, document.getElementById('login-pass').value);
    renderAccount();
  } catch (err) {
    Store.toast(err.message, 'error');
  }
}

function doRegister(e) {
  e.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const pass = document.getElementById('reg-pass').value;
  const pass2 = document.getElementById('reg-pass2').value;
  if (pass !== pass2) { Store.toast('Пароли не совпадают', 'error'); return; }
  try {
    Store.register(name, email, pass);
    renderAccount();
  } catch (err) {
    Store.toast(err.message, 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  Store.initPage('account');
  renderAccount();
});
