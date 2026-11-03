/* VYRON — Cart Page Logic */

let appliedPromo = null;

function renderCart() {
  const el = document.getElementById('cart-content');
  const cart = Store.getCart();

  if (cart.length === 0) {
    el.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">🛒</div>
        <h2>Корзина пуста</h2>
        <p>Добавьте товары из каталога, чтобы оформить заказ</p>
        <a href="catalog.html" class="btn btn--primary">Перейти в каталог</a>
      </div>`;
    return;
  }

  const items = cart.map((item, idx) => {
    const p = Store.getProduct(item.id);
    if (!p) return '';
    return `
      <div class="cart-item">
        <div class="cart-item__img">
          <img src="${p.image}" alt="${p.name}">
        </div>
        <div class="cart-item__info">
          <h4><a href="product.html?id=${p.id}">${p.name}</a></h4>
          <p>Размер: ${item.size} · Цвет: ${item.color}</p>
          <p style="color:var(--orange);font-weight:600">${Store.fmtPrice(p.price)}</p>
          <button class="cart-item__remove" onclick="removeItem(${idx})">Удалить</button>
        </div>
        <div>
          <div class="cart-item__price">${Store.fmtPrice(p.price * item.qty)}</div>
          <div class="cart-item__qty">
            <button onclick="changeQty(${idx}, -1)">−</button>
            <span>${item.qty}</span>
            <button onclick="changeQty(${idx}, 1)">+</button>
          </div>
        </div>
      </div>`;
  }).join('');

  const subtotal = Store.cartTotal();
  const discount = appliedPromo ? (appliedPromo.type === 'percent' ? Math.round(subtotal * appliedPromo.discount / 100) : appliedPromo.discount) : 0;
  const total = subtotal - discount;

  el.innerHTML = `
    <div class="cart-layout">
      <div class="cart-items">${items}</div>
      <div class="cart-summary">
        <h3>Итого</h3>
        <div class="cart-summary__row"><span>Товары (${Store.cartCount()} шт):</span><span>${Store.fmtPrice(subtotal)}</span></div>
        ${discount > 0 ? `<div class="cart-summary__row" style="color:var(--success)"><span>Скидка:</span><span>−${Store.fmtPrice(discount)}</span></div>` : ''}
        <div class="cart-summary__row"><span>Доставка:</span><span>${subtotal >= 5000 ? 'Бесплатно' : Store.fmtPrice(290)}</span></div>
        <div class="cart-summary__row cart-summary__row--total"><span>К оплате:</span><span>${Store.fmtPrice(total + (subtotal >= 5000 ? 0 : 290))}</span></div>
        <div class="cart-summary__promo">
          <input type="text" id="promo-input" placeholder="Промокод" value="${appliedPromo ? appliedPromo.code : ''}">
          <button class="btn btn--ghost btn--sm" onclick="applyPromo()">Применить</button>
          <div id="promo-msg"></div>
        </div>
        <a href="checkout.html${appliedPromo ? '?promo=' + appliedPromo.code : ''}" class="btn btn--primary btn--block" style="margin-top:16px">Оформить заказ</a>
        <a href="catalog.html" class="btn btn--ghost btn--block" style="margin-top:8px">Продолжить покупки</a>
      </div>
    </div>`;

  if (appliedPromo) showPromoMsg('Промокод применён: ' + appliedPromo.code, true);
}

function removeItem(idx) {
  Store.removeFromCart(idx);
  renderCart();
}
function changeQty(idx, d) {
  const cart = Store.getCart();
  if (cart[idx]) {
    Store.updateQty(idx, cart[idx].qty + d);
    renderCart();
  }
}
function applyPromo() {
  const code = document.getElementById('promo-input').value;
  if (!code) { appliedPromo = null; renderCart(); return; }
  const res = Store.validatePromo(code, Store.cartTotal());
  if (res.ok) {
    appliedPromo = res.promo;
    showPromoMsg('Промокод применён: −' + (res.promo.type === 'percent' ? res.promo.discount + '%' : Store.fmtPrice(res.promo.discount)), true);
    renderCart();
  } else {
    appliedPromo = null;
    showPromoMsg(res.msg, false);
  }
}
function showPromoMsg(msg, ok) {
  const el = document.getElementById('promo-msg');
  if (el) el.innerHTML = `<div class="promo-msg ${ok ? 'promo-msg--ok' : 'promo-msg--err'}">${msg}</div>`;
}

document.addEventListener('DOMContentLoaded', () => {
  Store.initPage('cart');
  renderCart();
});
