/* VYRON — Product Detail Page Logic */

let currentProduct = null;
let selectedSize = null;
let selectedColor = null;
let selectedQty = 1;

function loadProduct() {
  const id = new URLSearchParams(location.search).get('id');
  if (!id) { showError(); return; }
  currentProduct = Store.getProduct(id);
  if (!currentProduct) { showError(); return; }
  selectedSize = currentProduct.sizes[0];
  selectedColor = currentProduct.colors[0]?.name || '';
  selectedQty = 1;
  renderProduct();
  renderTabs();
  renderRelated();
}

function showError() {
  document.getElementById('product-content').innerHTML = `
    <div class="empty-state">
      <div class="empty-state__icon">😕</div>
      <h2>Товар не найден</h2>
      <p>Возможно, товар был удалён или ссылка некорректна</p>
      <a href="catalog.html" class="btn btn--primary">В каталог</a>
    </div>`;
  document.getElementById('product-tabs').style.display = 'none';
}

function renderProduct() {
  const p = currentProduct;
  const catName = Store.CATEGORIES.find(c => c.id === p.category)?.name || '';

  // Breadcrumb
  document.getElementById('breadcrumb').innerHTML = `
    <a href="index.html">Главная</a> <span>/</span>
    <a href="catalog.html?category=${p.category}">${catName}</a> <span>/</span>
    <span>${p.name}</span>`;

  const oldPrice = p.oldPrice ? `<span class="old-price">${Store.fmtPrice(p.oldPrice)}</span>` : '';
  const discountBadge = p.discount ? `<span class="badge badge--sale" style="display:inline-block;margin-left:12px">-${p.discount}%</span>` : '';

  // Gallery
  const galleryImgs = (p.gallery && p.gallery.length > 1) ? p.gallery : [p.image, p.image];

  document.getElementById('product-content').innerHTML = `
    <div class="product-detail">
      <div class="product-gallery">
        <div class="product-gallery__main">
          <img id="main-img" src="${galleryImgs[0]}" alt="${p.name}">
        </div>
        <div class="product-gallery__thumbs">
          ${galleryImgs.map((src, i) => `
            <div class="product-gallery__thumb ${i === 0 ? 'active' : ''}" onclick="swapImg(${i})">
              <img src="${src}" alt="${p.name} ${i + 1}">
            </div>`).join('')}
        </div>
      </div>
      <div class="product-info">
        <div class="product-info__cat">${catName} · ${p.brand}</div>
        <h1 class="product-info__name">${p.name}</h1>
        <div class="product-info__rating">
          <span class="stars">${Store.stars(p.rating)}</span>
          <span>${p.rating} из 5</span>
          <span>·</span>
          <span>${p.reviews} отзывов</span>
        </div>
        <div class="product-info__price">
          <span class="price">${Store.fmtPrice(p.price)}</span>
          ${oldPrice}
          ${discountBadge}
        </div>
        <p class="product-info__desc">${p.description}</p>

        ${p.sizes.length > 1 || p.sizes[0] !== 'Универсальный' ? `
        <div class="product-info__block">
          <div class="product-info__label">Размер</div>
          <div class="size-list" id="size-list">
            ${p.sizes.map(s => `<div class="size-item ${s === selectedSize ? 'active' : ''}" onclick="selectSize('${s}')">${s}</div>`).join('')}
          </div>
        </div>` : ''}

        ${p.colors.length > 0 ? `
        <div class="product-info__block">
          <div class="product-info__label">Цвет: <span id="color-name">${selectedColor}</span></div>
          <div class="color-list">
            ${p.colors.map(c => `<div class="color-item ${c.name === selectedColor ? 'active' : ''}" style="background:${c.hex}" title="${c.name}" onclick="selectColor('${c.name}', this)"></div>`).join('')}
          </div>
        </div>` : ''}

        <div class="product-info__block">
          <div class="product-info__label">Количество</div>
          <div class="qty-control">
            <button onclick="changeQty(-1)">−</button>
            <input type="text" id="qty-input" value="1" readonly>
            <button onclick="changeQty(1)">+</button>
          </div>
        </div>

        <div class="product-info__actions">
          <button class="btn btn--primary btn--lg" style="flex:1" onclick="addToCartFromDetail()">В корзину</button>
          <button class="btn ${Store.isFav(p.id) ? 'btn--dark' : 'btn--outline'} btn--lg" onclick="toggleFavDetail()">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="${Store.isFav(p.id) ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            ${Store.isFav(p.id) ? 'В избранном' : 'В избранное'}
          </button>
        </div>

        <div class="product-info__meta">
          <div><strong>Артикул:</strong> VRN-${String(p.id).padStart(5, '0')}</div>
          <div><strong>Наличие:</strong> ${p.stock > 0 ? `В наличии (${p.stock} шт)` : 'Нет в наличии'}</div>
          <div><strong>Доставка:</strong> Бесплатно от 5 000 ₽</div>
          <div><strong>Гарантия:</strong> Возврат в течение 30 дней</div>
        </div>
      </div>
    </div>`;
}

function renderTabs() {
  const p = currentProduct;
  document.getElementById('product-tabs').style.display = 'block';
  document.getElementById('product-tabs').innerHTML = `
    <div class="tabs__nav">
      <div class="tabs__tab active" onclick="switchTab(0)">Описание</div>
      <div class="tabs__tab" onclick="switchTab(1)">Характеристики</div>
      <div class="tabs__tab" onclick="switchTab(2)">Отзывы (${p.reviews})</div>
    </div>
    <div class="tabs__panel active" data-panel="0">
      <p>${p.description}</p>
      <p style="margin-top:12px">Товар бренда ${p.brand} производится из качественных материалов с соблюдением международных стандартов. Подходит как для профессиональных спортсменов, так и для любителей активного образа жизни.</p>
    </div>
    <div class="tabs__panel" data-panel="1">
      <table style="width:100%;border-collapse:collapse">
        ${[
          ['Бренд', p.brand],
          ['Категория', Store.CATEGORIES.find(c => c.id === p.category)?.name],
          ['Подкатегория', catalogSubName(p.subcategory)],
          ['Рейтинг', `${p.rating} / 5`],
          ['Количество отзывов', p.reviews],
          ['Доступные размеры', p.sizes.join(', ')],
          ['Доступные цвета', p.colors.map(c => c.name).join(', ') || '—'],
          ['В наличии', `${p.stock} шт`],
          ['Артикул', `VRN-${String(p.id).padStart(5, '0')}`],
        ].map(([k, v]) => `<tr><td style="padding:10px 0;border-bottom:1px solid var(--border);width:40%;font-weight:600;color:#888">${k}</td><td style="padding:10px 0;border-bottom:1px solid var(--border)">${v || '—'}</td></tr>`).join('')}
      </table>
    </div>
    <div class="tabs__panel" data-panel="2">
      ${REVIEWS.map(r => `
        <div class="review">
          <div class="review__header">
            <span class="review__author">${r.author}</span>
            <span class="review__date">${r.date} · <span class="stars" style="color:var(--star)">${Store.stars(r.rating)}</span></span>
          </div>
          <p style="color:#666">${r.text}</p>
        </div>`).join('')}
    </div>`;
}

function catalogSubName(s) {
  const names = {
    running:'Беговые',classic:'Классические',trail:'Трейловые',lifestyle:'Lifestyle',training:'Тренировочные',
    hoodie:'Худи',tracksuit:'Костюмы',set:'Комплекты',jacket:'Куртки',tank:'Майки',shorts:'Шорты',
    headphones:'Наушники',bag:'Сумки',bottle:'Бутылки',watch:'Часы',cap:'Кепки',
    dumbbells:'Гантели',kettlebell:'Гири',weights:'Блины',tennis:'Теннис',gloves:'Перчатки',
  };
  return names[s] || s;
}

function renderRelated() {
  const p = currentProduct;
  const related = Store.filterProducts({ category: p.category })
    .filter(x => x.id !== p.id)
    .slice(0, 4);
  document.getElementById('related-products').innerHTML = related.map(Store.productCard).join('');
}

// Interactions
function swapImg(i) {
  const p = currentProduct;
  const imgs = (p.gallery && p.gallery.length > 1) ? p.gallery : [p.image, p.image];
  document.getElementById('main-img').src = imgs[i];
  document.querySelectorAll('.product-gallery__thumb').forEach((t, idx) => t.classList.toggle('active', idx === i));
}
function selectSize(s) {
  selectedSize = s;
  document.querySelectorAll('.size-item').forEach(el => el.classList.toggle('active', el.textContent === String(s)));
}
function selectColor(name, el) {
  selectedColor = name;
  document.querySelectorAll('.color-item').forEach(e => e.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('color-name').textContent = name;
}
function changeQty(d) {
  selectedQty = Math.max(1, selectedQty + d);
  document.getElementById('qty-input').value = selectedQty;
}
function addToCartFromDetail() {
  Store.addToCart(currentProduct.id, selectedSize, selectedColor, selectedQty);
  const btn = document.querySelector('.product-info__actions .btn--primary');
  btn.textContent = '✓ Добавлено';
  btn.style.background = 'var(--success)';
  setTimeout(() => { btn.textContent = 'В корзину'; btn.style.background = ''; }, 2000);
}
function toggleFavDetail() {
  Store.toggleFav(currentProduct.id);
  renderProduct();
}
function switchTab(i) {
  document.querySelectorAll('.tabs__tab').forEach((t, idx) => t.classList.toggle('active', idx === i));
  document.querySelectorAll('.tabs__panel').forEach((p, idx) => p.classList.toggle('active', idx === i));
}

window.renderCards = () => renderRelated();

document.addEventListener('DOMContentLoaded', () => {
  Store.initPage('');
  loadProduct();
});
