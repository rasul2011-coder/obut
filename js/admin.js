/* VYRON — Admin Panel Logic */

let adminTab = 'dashboard';

function renderAdmin() {
  const el = document.getElementById('admin-content');
  el.innerHTML = `
    <div class="admin-layout">
      <aside class="admin-nav">
        <div class="admin-nav__item active" data-tab="dashboard" onclick="switchAdminTab('dashboard', this)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          Дашборд
        </div>
        <div class="admin-nav__item" data-tab="products" onclick="switchAdminTab('products', this)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
          Товары
        </div>
        <div class="admin-nav__item" data-tab="orders" onclick="switchAdminTab('orders', this)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          Заказы
        </div>
        <div class="admin-nav__item" data-tab="discounts" onclick="switchAdminTab('discounts', this)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>
          Скидки
        </div>
      </aside>
      <div class="admin-content" id="admin-tab-content"></div>
    </div>`;
  renderAdminTab();
}

function switchAdminTab(tab, el) {
  adminTab = tab;
  document.querySelectorAll('.admin-nav__item').forEach(i => i.classList.remove('active'));
  if (el) el.classList.add('active');
  renderAdminTab();
}

function renderAdminTab() {
  const el = document.getElementById('admin-tab-content');
  if (adminTab === 'dashboard') renderDashboard(el);
  else if (adminTab === 'products') renderProducts(el);
  else if (adminTab === 'orders') renderOrders(el);
  else if (adminTab === 'discounts') renderDiscounts(el);
}

function renderDashboard(el) {
  const products = Store.getProducts();
  const orders = Store.getAllOrders();
  const users = Store.getUsers();
  const revenue = orders.reduce((s, o) => s + o.total, 0);
  el.innerHTML = `
    <h2>Дашборд</h2>
    <div class="admin-stats">
      <div class="stat-card">
        <div class="stat-card__label">Товары</div>
        <div class="stat-card__value">${products.length}<span> шт</span></div>
      </div>
      <div class="stat-card">
        <div class="stat-card__label">Заказы</div>
        <div class="stat-card__value">${orders.length}<span> шт</span></div>
      </div>
      <div class="stat-card">
        <div class="stat-card__label">Выручка</div>
        <div class="stat-card__value">${revenue.toLocaleString('ru-RU')}<span> ₽</span></div>
      </div>
      <div class="stat-card">
        <div class="stat-card__label">Пользователи</div>
        <div class="stat-card__value">${users.length}<span> чел</span></div>
      </div>
    </div>
    <h3 style="margin-bottom:16px">Последние заказы</h3>
    ${orders.length === 0 ? '<p style="color:#888">Заказов пока нет</p>' : `
      <table class="admin-table">
        <thead><tr><th>№</th><th>Дата</th><th>Клиент</th><th>Товары</th><th>Сумма</th><th>Статус</th></tr></thead>
        <tbody>
          ${orders.slice(-5).reverse().map(o => `
            <tr>
              <td>#${o.id}</td>
              <td>${new Date(o.date).toLocaleDateString('ru-RU')}</td>
              <td>${o.name}<br><span style="color:#999;font-size:12px">${o.email}</span></td>
              <td>${o.items.length} шт</td>
              <td><strong>${Store.fmtPrice(o.total)}</strong></td>
              <td><span class="order-card__status order-card__status--${o.status}">${o.status === 'new' ? 'Новый' : 'Выполнен'}</span></td>
            </tr>`).join('')}
        </tbody>
      </table>`}
    <h3 style="margin:24px 0 16px">Топ товаров</h3>
    <table class="admin-table">
      <thead><tr><th>Товар</th><th>Категория</th><th>Цена</th><th>Скидка</th><th>Рейтинг</th><th>Остаток</th></tr></thead>
      <tbody>
        ${products.slice(0, 5).map(p => `
          <tr>
            <td style="display:flex;align-items:center;gap:8px"><img src="${p.image}" alt=""> ${p.name}</td>
            <td>${Store.CATEGORIES.find(c => c.id === p.category)?.name || ''}</td>
            <td>${Store.fmtPrice(p.price)}</td>
            <td>${p.discount ? '-' + p.discount + '%' : '—'}</td>
            <td>${Store.stars(p.rating)} ${p.rating}</td>
            <td>${p.stock} шт</td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

function renderProducts(el) {
  const products = Store.getProducts();
  el.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <h2>Товары (${products.length})</h2>
      <button class="btn btn--primary" onclick="openProductModal()">+ Добавить товар</button>
    </div>
    <table class="admin-table">
      <thead><tr><th>Фото</th><th>Название</th><th>Категория</th><th>Цена</th><th>Старая цена</th><th>Скидка</th><th>Новинка</th><th>Хит</th><th>Остаток</th><th>Действия</th></tr></thead>
      <tbody>
        ${products.map(p => `
          <tr>
            <td><img src="${p.image}" alt="${p.name}"></td>
            <td style="max-width:200px">${p.name}</td>
            <td>${Store.CATEGORIES.find(c => c.id === p.category)?.name || ''}</td>
            <td>${Store.fmtPrice(p.price)}</td>
            <td>${p.oldPrice ? Store.fmtPrice(p.oldPrice) : '—'}</td>
            <td>${p.discount ? '-' + p.discount + '%' : '—'}</td>
            <td>${p.isNew ? '✅' : '—'}</td>
            <td>${p.isHit ? '✅' : '—'}</td>
            <td>${p.stock}</td>
            <td class="admin-actions">
              <button class="edit" onclick="openProductModal(${p.id})">✎</button>
              <button class="del" onclick="deleteProd(${p.id})">🗑</button>
            </td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

function renderOrders(el) {
  const orders = Store.getAllOrders();
  el.innerHTML = `<h2>Все заказы (${orders.length})</h2>`;
  if (orders.length === 0) {
    el.innerHTML += '<p style="color:#888;padding:20px 0">Заказов пока нет</p>';
    return;
  }
  el.innerHTML += orders.slice().reverse().map(o => `
    <div class="order-card">
      <div class="order-card__header">
        <div class="order-card__num">Заказ #${o.id}</div>
        <div class="order-card__status order-card__status--${o.status}">${o.status === 'new' ? 'Новый' : 'Выполнен'}</div>
      </div>
      <div style="font-size:14px;color:#888;margin-bottom:8px">
        ${new Date(o.date).toLocaleString('ru-RU')} · ${o.name} · ${o.email} · ${o.phone || '—'}
      </div>
      <div style="font-size:14px;color:#888;margin-bottom:8px">
        ${o.city || ''}, ${o.address || ''} · ${o.delivery === 'pickup' ? 'Самовывоз' : o.delivery === 'post' ? 'Почта' : 'Курьер'} · ${o.payment === 'card' ? 'Картой' : o.payment === 'sbp' ? 'СБП' : 'Наличными'}
      </div>
      <div class="order-card__items">
        ${o.items.map(i => `<img src="${i.image}" alt="${i.name}" title="${i.name} (${i.size}, ${i.color}, ${i.qty} шт)">`).join('')}
      </div>
      <div class="order-card__footer">
        <div>
          ${o.discount > 0 ? `<span style="color:var(--success);font-size:14px">Скидка: −${Store.fmtPrice(o.discount)}${o.promoCode ? ' (' + o.promoCode + ')' : ''}</span>` : ''}
          <button class="btn btn--ghost btn--sm" style="margin-left:8px" onclick="toggleOrderStatus(${o.id})">
            ${o.status === 'new' ? 'Отметить выполненным' : 'Отметить новым'}
          </button>
        </div>
        <div style="font-family:var(--font-head);font-size:20px;font-weight:700">${Store.fmtPrice(o.total)}</div>
      </div>
    </div>`).join('');
}

function renderDiscounts(el) {
  const products = Store.getProducts();
  el.innerHTML = `
    <h2>Управление скидками</h2>
    <p style="color:#888;margin-bottom:20px">Установите скидку в процентах для товаров. Старая цена рассчитается автоматически.</p>
    <table class="admin-table">
      <thead><tr><th>Фото</th><th>Название</th><th>Текущая цена</th><th>Старая цена</th><th>Скидка %</th><th>Действие</th></tr></thead>
      <tbody>
        ${products.map(p => `
          <tr>
            <td><img src="${p.image}" alt=""></td>
            <td style="max-width:200px">${p.name}</td>
            <td>${Store.fmtPrice(p.price)}</td>
            <td>${p.oldPrice ? Store.fmtPrice(p.oldPrice) : '—'}</td>
            <td>
              <input type="number" id="disc-${p.id}" value="${p.discount || 0}" min="0" max="90" style="width:70px;padding:6px;border:1px solid var(--border);border-radius:4px">
            </td>
            <td><button class="btn btn--primary btn--sm" onclick="applyDiscount(${p.id})">Применить</button></td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

function applyDiscount(id) {
  const discount = parseInt(document.getElementById('disc-' + id).value) || 0;
  const p = Store.getProduct(id);
  if (!p) return;
  const updates = { discount };
  if (discount > 0) {
    updates.oldPrice = Math.round(p.price / (1 - discount / 100));
  } else {
    updates.oldPrice = null;
  }
  Store.updateProduct(id, updates);
  Store.toast('Скидка обновлена', 'success');
  renderAdminTab();
}

function toggleOrderStatus(id) {
  const orders = Store.getAllOrders();
  const o = orders.find(x => x.id === id);
  if (!o) return;
  o.status = o.status === 'new' ? 'done' : 'new';
  localStorage.setItem('vyron_orders', JSON.stringify(orders));
  Store.toast('Статус заказа обновлён', 'success');
  renderAdminTab();
}

// Product modal
function openProductModal(id) {
  const p = id ? Store.getProduct(id) : null;
  document.getElementById('modal-content').innerHTML = `
    <button class="modal__close" onclick="closeModal()">&times;</button>
    <h2 class="modal__title">${p ? 'Редактировать товар' : 'Новый товар'}</h2>
    <form onsubmit="saveProduct(event, ${id || 'null'})">
      <div class="form-group">
        <label>Название *</label>
        <input type="text" id="p-name" value="${p?.name || ''}" required>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Категория *</label>
          <select id="p-category" required>
            ${Store.CATEGORIES.map(c => `<option value="${c.id}" ${p?.category === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Подкатегория</label>
          <input type="text" id="p-subcategory" value="${p?.subcategory || ''}" placeholder="running, hoodie...">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Цена (₽) *</label>
          <input type="number" id="p-price" value="${p?.price || ''}" required min="1">
        </div>
        <div class="form-group">
          <label>Старая цена (₽)</label>
          <input type="number" id="p-oldprice" value="${p?.oldPrice || ''}" min="0">
        </div>
      </div>
      <div class="form-group">
        <label>URL изображения *</label>
        <input type="url" id="p-image" value="${p?.image || ''}" required placeholder="https://images.pexels.com/...">
        ${p ? `<img src="${p.image}" style="width:80px;height:80px;border-radius:8px;margin-top:8px;object-fit:cover">` : ''}
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Размеры (через запятую)</label>
          <input type="text" id="p-sizes" value="${p?.sizes?.join(',') || '40,41,42,43,44'}">
        </div>
        <div class="form-group">
          <label>Остаток</label>
          <input type="number" id="p-stock" value="${p?.stock ?? 10}" min="0">
        </div>
      </div>
      <div class="form-group">
        <label>Цвета (название:#hex, через запятую)</label>
        <input type="text" id="p-colors" value="${p?.colors?.map(c => c.name + ':' + c.hex).join(',') || 'Чёрный:#1a1a1a'}">
      </div>
      <div class="form-group">
        <label>Описание</label>
        <textarea id="p-desc" rows="3">${p?.description || ''}</textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Рейтинг</label>
          <input type="number" id="p-rating" value="${p?.rating || 4.5}" min="0" max="5" step="0.1">
        </div>
        <div class="form-group">
          <label>Отзывов</label>
          <input type="number" id="p-reviews" value="${p?.reviews || 0}" min="0">
        </div>
      </div>
      <div style="display:flex;gap:16px;margin-bottom:16px">
        <label><input type="checkbox" id="p-new" ${p?.isNew ? 'checked' : ''}> Новинка</label>
        <label><input type="checkbox" id="p-hit" ${p?.isHit ? 'checked' : ''}> Хит</label>
      </div>
      <div style="display:flex;gap:12px">
        <button type="submit" class="btn btn--primary" style="flex:1">${p ? 'Сохранить' : 'Добавить'}</button>
        <button type="button" class="btn btn--ghost" onclick="closeModal()">Отмена</button>
      </div>
    </form>`;
  document.getElementById('product-modal').classList.add('show');
}

function closeModal() {
  document.getElementById('product-modal').classList.remove('show');
}

function saveProduct(e, id) {
  e.preventDefault();
  const sizes = document.getElementById('p-sizes').value.split(',').map(s => s.trim()).filter(Boolean);
  const parsedSizes = sizes.map(s => isNaN(s) ? s : Number(s));
  const colors = document.getElementById('p-colors').value.split(',').map(c => {
    const [name, hex] = c.split(':').map(x => x.trim());
    return { name: name || 'Чёрный', hex: hex || '#1a1a1a' };
  }).filter(c => c.name);

  const price = parseInt(document.getElementById('p-price').value) || 0;
  const oldPrice = parseInt(document.getElementById('p-oldprice').value) || null;
  const discount = oldPrice && oldPrice > price ? Math.round((1 - price / oldPrice) * 100) : 0;

  const data = {
    name: document.getElementById('p-name').value.trim(),
    category: document.getElementById('p-category').value,
    subcategory: document.getElementById('p-subcategory').value.trim() || 'general',
    price,
    oldPrice,
    discount,
    image: document.getElementById('p-image').value.trim(),
    gallery: [document.getElementById('p-image').value.trim()],
    sizes: parsedSizes,
    colors,
    description: document.getElementById('p-desc').value.trim(),
    stock: parseInt(document.getElementById('p-stock').value) || 0,
    rating: parseFloat(document.getElementById('p-rating').value) || 4.5,
    reviews: parseInt(document.getElementById('p-reviews').value) || 0,
    isNew: document.getElementById('p-new').checked,
    isHit: document.getElementById('p-hit').checked,
    brand: 'VYRON',
  };

  if (id) {
    Store.updateProduct(id, data);
    Store.toast('Товар обновлён', 'success');
  } else {
    Store.addProduct(data);
    Store.toast('Товар добавлен', 'success');
  }
  closeModal();
  renderAdminTab();
}

function deleteProd(id) {
  if (!confirm('Удалить товар? Это действие нельзя отменить.')) return;
  Store.deleteProduct(id);
  Store.toast('Товар удалён', 'success');
  renderAdminTab();
}

document.addEventListener('DOMContentLoaded', () => {
  Store.initPage('');
  renderAdmin();
});
