/* VYRON — Checkout Page Logic */

let ckPromo = null;

function renderCheckout() {
  const el = document.getElementById('checkout-content');
  const cart = Store.getCart();

  if (cart.length === 0) {
    el.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">🛒</div>
        <h2>Корзина пуста</h2>
        <p>Добавьте товары, чтобы оформить заказ</p>
        <a href="catalog.html" class="btn btn--primary">В каталог</a>
      </div>`;
    return;
  }

  // Check promo from URL
  const urlPromo = new URLSearchParams(location.search).get('promo');
  if (urlPromo && !ckPromo) {
    const res = Store.validatePromo(urlPromo, Store.cartTotal());
    if (res.ok) ckPromo = res.promo;
  }

  const subtotal = Store.cartTotal();
  const discount = ckPromo ? (ckPromo.type === 'percent' ? Math.round(subtotal * ckPromo.discount / 100) : ckPromo.discount) : 0;
  const shipping = subtotal >= 5000 ? 0 : 290;
  const total = subtotal - discount + shipping;

  const user = Store.currentUser();
  const items = cart.map(item => {
    const p = Store.getProduct(item.id);
    return p ? `
      <div class="order-item">
        <div style="display:flex;align-items:center;flex:1">
          <img src="${p.image}" alt="${p.name}">
          <div class="order-item__name">${p.name}<br><span style="color:#999">${item.size} · ${item.color} · ${item.qty} шт</span></div>
        </div>
        <span style="white-space:nowrap">${Store.fmtPrice(p.price * item.qty)}</span>
      </div>` : '';
  }).join('');

  el.innerHTML = `
    <div class="checkout-layout">
      <form class="checkout-form" id="checkout-form" onsubmit="placeOrder(event)">
        <div class="form-section">
          <h3>Контактные данные</h3>
          <div class="form-row">
            <div class="form-group">
              <label>Имя и фамилия *</label>
              <input type="text" id="ck-name" value="${user?.name || ''}" required>
              <div class="form-error" id="err-name"></div>
            </div>
            <div class="form-group">
              <label>Email *</label>
              <input type="email" id="ck-email" value="${user?.email || ''}" required>
              <div class="form-error" id="err-email"></div>
            </div>
          </div>
          <div class="form-group">
            <label>Телефон *</label>
            <input type="tel" id="ck-phone" placeholder="+7 (___) ___-__-__" value="${user?.phone || ''}" required>
            <div class="form-error" id="err-phone"></div>
          </div>
        </div>

        <div class="form-section">
          <h3>Доставка</h3>
          <div class="form-row">
            <div class="form-group">
              <label>Город *</label>
              <input type="text" id="ck-city" value="${user?.city || ''}" required>
              <div class="form-error" id="err-city"></div>
            </div>
            <div class="form-group">
              <label>Индекс *</label>
              <input type="text" id="ck-zip" placeholder="123456" required>
              <div class="form-error" id="err-zip"></div>
            </div>
          </div>
          <div class="form-group">
            <label>Адрес доставки *</label>
            <textarea id="ck-address" rows="3" placeholder="Улица, дом, квартира" required>${user?.address || ''}</textarea>
            <div class="form-error" id="err-address"></div>
          </div>
          <div class="form-group">
            <label>Способ доставки</label>
            <select id="ck-delivery" onchange="updateTotals()">
              <option value="courier">Курьер — 290 ₽ (бесплатно от 5 000 ₽)</option>
              <option value="pickup">Самовывоз — бесплатно</option>
              <option value="post">Почта России — 350 ₽</option>
            </select>
          </div>
        </div>

        <div class="form-section">
          <h3>Оплата</h3>
          <div class="form-group">
            <select id="ck-payment">
              <option value="card">Картой онлайн</option>
              <option value="sbp">СБП (Система быстрых платежей)</option>
              <option value="cash">Наличными при получении</option>
            </select>
          </div>
          <div class="form-group">
            <label>Комментарий к заказу</label>
            <textarea id="ck-comment" rows="2" placeholder="Дополнительная информация"></textarea>
          </div>
        </div>

        <button type="submit" class="btn btn--primary btn--lg btn--block">Подтвердить заказ</button>
      </form>

      <div class="order-summary">
        <h3>Ваш заказ</h3>
        ${items}
        <div class="cart-summary__row" style="margin-top:12px"><span>Товары:</span><span>${Store.fmtPrice(subtotal)}</span></div>
        ${discount > 0 ? `<div class="cart-summary__row" style="color:var(--success)"><span>Скидка${ckPromo ? ' (' + ckPromo.code + ')' : ''}:</span><span>−${Store.fmtPrice(discount)}</span></div>` : ''}
        <div class="cart-summary__row"><span>Доставка:</span><span id="ck-shipping">${shipping === 0 ? 'Бесплатно' : Store.fmtPrice(shipping)}</span></div>
        <div class="cart-summary__row cart-summary__row--total"><span>Итого:</span><span id="ck-total">${Store.fmtPrice(total)}</span></div>
      </div>
    </div>`;

  // Save user data if logged in
  if (!user && Store.isLoggedIn()) {
    Store.updateProfile({ phone: '', address: '', city: '' });
  }
}

function updateTotals() {
  const delivery = document.getElementById('ck-delivery').value;
  const subtotal = Store.cartTotal();
  const discount = ckPromo ? (ckPromo.type === 'percent' ? Math.round(subtotal * ckPromo.discount / 100) : ckPromo.discount) : 0;
  let shipping = 0;
  if (delivery === 'courier') shipping = subtotal >= 5000 ? 0 : 290;
  else if (delivery === 'post') shipping = 350;
  else if (delivery === 'pickup') shipping = 0;
  const total = subtotal - discount + shipping;
  document.getElementById('ck-shipping').textContent = shipping === 0 ? 'Бесплатно' : Store.fmtPrice(shipping);
  document.getElementById('ck-total').textContent = Store.fmtPrice(total);
}

function validateField(id, val) {
  const errEl = document.getElementById('err-' + id.replace('ck-', ''));
  const input = document.getElementById(id);
  if (!val) {
    if (input) input.classList.add('error');
    if (errEl) errEl.textContent = 'Обязательное поле';
    return false;
  }
  if (input) input.classList.remove('error');
  if (errEl) errEl.textContent = '';
  return true;
}

function placeOrder(e) {
  e.preventDefault();
  const fields = {
    name: document.getElementById('ck-name').value.trim(),
    email: document.getElementById('ck-email').value.trim(),
    phone: document.getElementById('ck-phone').value.trim(),
    city: document.getElementById('ck-city').value.trim(),
    zip: document.getElementById('ck-zip').value.trim(),
    address: document.getElementById('ck-address').value.trim(),
  };
  const delivery = document.getElementById('ck-delivery').value;
  const payment = document.getElementById('ck-payment').value;
  const comment = document.getElementById('ck-comment').value.trim();

  let valid = true;
  if (!validateField('ck-name', fields.name)) valid = false;
  if (!validateField('ck-email', fields.email)) valid = false;
  if (!validateField('ck-phone', fields.phone)) valid = false;
  if (!validateField('ck-city', fields.city)) valid = false;
  if (!validateField('ck-zip', fields.zip)) valid = false;
  if (!validateField('ck-address', fields.address)) valid = false;

  if (!valid) {
    Store.toast('Заполните все обязательные поля', 'error');
    return;
  }

  try {
    const order = Store.createOrder({
      ...fields,
      delivery,
      payment,
      comment,
    }, ckPromo);

    // Save user profile data
    if (Store.isLoggedIn()) {
      Store.updateProfile({ phone: fields.phone, city: fields.city, address: fields.address });
    }

    showSuccess(order);
  } catch (err) {
    Store.toast(err.message, 'error');
  }
}

function showSuccess(order) {
  document.getElementById('checkout-content').innerHTML = `
    <div class="empty-state">
      <div class="empty-state__icon" style="font-size:80px">✅</div>
      <h1 style="color:var(--success)">Заказ оформлен!</h1>
      <p style="font-size:18px;margin-bottom:8px">Спасибо за покупку в VYRON</p>
      <p>Номер вашего заказа: <strong style="color:var(--orange);font-size:20px">#${order.id}</strong></p>
      <p style="margin-bottom:8px">Сумма заказа: <strong>${Store.fmtPrice(order.total)}</strong></p>
      <p style="color:#888;margin-bottom:24px">Мы свяжемся с вами по телефону для подтверждения заказа</p>
      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
        <a href="catalog.html" class="btn btn--primary">Продолжить покупки</a>
        <a href="account.html" class="btn btn--outline">Мои заказы</a>
      </div>
    </div>`;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.addEventListener('DOMContentLoaded', () => {
  Store.initPage('');
  renderCheckout();
});
