/* VYRON — Catalog Page Logic */

const state = {
  category: 'all',
  subcategory: null,
  search: '',
  sizes: [],
  colors: [],
  minPrice: null,
  maxPrice: null,
  onlyDiscount: false,
  onlyNew: false,
  onlyHit: false,
  sort: 'default',
  page: 1,
  perPage: 12,
};

// All unique sizes and colors from products
const ALL_SIZES = [...new Set(Store.getProducts().flatMap(p => p.sizes.map(String)))].sort((a, b) => {
  const na = parseFloat(a), nb = parseFloat(b);
  if (isNaN(na)) return a.localeCompare(b);
  return na - nb;
});
const ALL_COLORS = [...new Map(Store.getProducts().flatMap(p => p.colors).map(c => [c.name, c])).values()];

function parseURL() {
  const p = new URLSearchParams(location.search);
  if (p.get('category')) state.category = p.get('category');
  if (p.get('subcategory')) state.subcategory = p.get('subcategory');
  if (p.get('search')) state.search = p.get('search');
  if (p.get('onlyDiscount') === '1') state.onlyDiscount = true;
  if (p.get('sort')) state.sort = p.get('sort');
}

function renderFilters() {
  // Categories
  let catHtml = `<label><input type="radio" name="cat" value="all" ${state.category === 'all' ? 'checked' : ''} onchange="setCategory('all')"> Все товары</label>`;
  Store.CATEGORIES.forEach(c => {
    const count = Store.filterProducts({ category: c.id }).length;
    catHtml += `<label><input type="radio" name="cat" value="${c.id}" ${state.category === c.id ? 'checked' : ''} onchange="setCategory('${c.id}')"> ${c.name} (${count})</label>`;
    if (state.category === c.id) {
      const subs = [...new Set(Store.filterProducts({ category: c.id }).map(p => p.subcategory))];
      subs.forEach(s => {
        catHtml += `<label style="padding-left:20px;font-size:13px;color:#888"><input type="radio" name="subcat" value="${s}" ${state.subcategory === s ? 'checked' : ''} onchange="setSubcategory('${s}')"> ${getSubName(s)}</label>`;
      });
    }
  });
  document.getElementById('filter-categories').innerHTML = catHtml;

  // Sizes
  document.getElementById('filter-sizes').innerHTML = ALL_SIZES.map(s =>
    `<label><input type="checkbox" value="${s}" ${state.sizes.includes(s) ? 'checked' : ''} onchange="toggleSize('${s}', this.checked)"> ${s}</label>`
  ).join('');

  // Colors
  document.getElementById('filter-colors').innerHTML = ALL_COLORS.map(c =>
    `<div class="filter-color__item ${state.colors.includes(c.name) ? 'active' : ''}" style="background:${c.hex}" title="${c.name}" onclick="toggleColor('${c.name}', this)"></div>`
  ).join('');

  // Price
  document.getElementById('min-price').value = state.minPrice || '';
  document.getElementById('max-price').value = state.maxPrice || '';

  // Toggles
  document.getElementById('f-discount').checked = state.onlyDiscount;
  document.getElementById('f-new').checked = state.onlyNew;
  document.getElementById('f-hit').checked = state.onlyHit;
}

const SUB_NAMES = {
  running: 'Беговые', classic: 'Классические', trail: 'Трейловые', lifestyle: 'Lifestyle', training: 'Тренировочные',
  hoodie: 'Худи', tracksuit: 'Костюмы', set: 'Комплекты', jacket: 'Куртки', tank: 'Майки', shorts: 'Шорты',
  headphones: 'Наушники', bag: 'Сумки', bottle: 'Бутылки', watch: 'Часы', cap: 'Кепки',
  dumbbells: 'Гантели', kettlebell: 'Гири', weights: 'Блины', tennis: 'Теннис', gloves: 'Перчатки',
};
function getSubName(s) { return SUB_NAMES[s] || s; }

function setCategory(cat) {
  state.category = cat;
  state.subcategory = null;
  state.page = 1;
  updateURL();
  renderFilters();
  render();
}
function setSubcategory(sub) {
  state.subcategory = sub;
  state.page = 1;
  updateURL();
  render();
}
function toggleSize(s, checked) {
  if (checked) state.sizes.push(s); else state.sizes.splice(state.sizes.indexOf(s), 1);
  state.page = 1;
  render();
}
function toggleColor(name, el) {
  if (state.colors.includes(name)) {
    state.colors.splice(state.colors.indexOf(name), 1);
    el.classList.remove('active');
  } else {
    state.colors.push(name);
    el.classList.add('active');
  }
  state.page = 1;
  render();
}
function toggleDiscount(checked) { state.onlyDiscount = checked; state.page = 1; render(); }
function toggleNew(checked) { state.onlyNew = checked; state.page = 1; render(); }
function toggleHit(checked) { state.onlyHit = checked; state.page = 1; render(); }
function applyPrice() {
  state.minPrice = parseFloat(document.getElementById('min-price').value) || null;
  state.maxPrice = parseFloat(document.getElementById('max-price').value) || null;
  state.page = 1;
  render();
}
function resetFilters() {
  state.category = 'all'; state.subcategory = null; state.search = ''; state.sizes = []; state.colors = [];
  state.minPrice = null; state.maxPrice = null; state.onlyDiscount = false; state.onlyNew = false; state.onlyHit = false;
  state.sort = 'default'; state.page = 1;
  document.getElementById('sort-select').value = 'default';
  updateURL(); renderFilters(); render();
}

function updateURL() {
  const p = new URLSearchParams();
  if (state.category !== 'all') p.set('category', state.category);
  if (state.subcategory) p.set('subcategory', state.subcategory);
  if (state.search) p.set('search', state.search);
  if (state.onlyDiscount) p.set('onlyDiscount', '1');
  if (state.sort !== 'default') p.set('sort', state.sort);
  history.replaceState(null, '', 'catalog.html' + (p.toString() ? '?' + p : ''));
}

function render() {
  const items = Store.filterProducts(state);
  const total = items.length;
  const pages = Math.ceil(total / state.perPage) || 1;
  if (state.page > pages) state.page = pages;
  const start = (state.page - 1) * state.perPage;
  const pageItems = items.slice(start, start + state.perPage);

  // Count
  document.getElementById('catalog-count').textContent = `Найдено: ${total} ${plural(total)}`;

  // Grid
  const grid = document.getElementById('product-grid');
  if (pageItems.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="empty-state__icon">🔍</div>
      <h2>Товары не найдены</h2>
      <p>Попробуйте изменить параметры поиска</p>
      <button class="btn btn--primary" onclick="resetFilters()">Сбросить фильтры</button>
    </div>`;
  } else {
    grid.innerHTML = pageItems.map(Store.productCard).join('');
  }

  // Pagination
  const pg = document.getElementById('pagination');
  if (pages <= 1) { pg.innerHTML = ''; return; }
  let html = '';
  html += `<button ${state.page === 1 ? 'disabled' : ''} onclick="goPage(${state.page - 1})">←</button>`;
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || Math.abs(i - state.page) <= 1) {
      html += `<button class="${i === state.page ? 'active' : ''}" onclick="goPage(${i})">${i}</button>`;
    } else if (Math.abs(i - state.page) === 2) {
      html += `<button disabled>...</button>`;
    }
  }
  html += `<button ${state.page === pages ? 'disabled' : ''} onclick="goPage(${state.page + 1})">→</button>`;
  pg.innerHTML = html;

  // Title & breadcrumb
  const catName = Store.CATEGORIES.find(c => c.id === state.category)?.name || 'Все товары';
  document.getElementById('page-title').textContent = state.subcategory ? getSubName(state.subcategory) : (state.category !== 'all' ? catName : 'Каталог');
  document.getElementById('bc-current').textContent = state.search ? `Поиск: ${state.search}` : (state.category !== 'all' ? catName : 'Каталог');
}

function goPage(n) { state.page = n; render(); window.scrollTo({ top: 200, behavior: 'smooth' }); }

function plural(n) {
  const m = n % 10, mm = n % 100;
  if (mm >= 11 && mm <= 14) return 'товаров';
  if (m === 1) return 'товар';
  if (m >= 2 && m <= 4) return 'товара';
  return 'товаров';
}

// Re-render cards on fav toggle
window.renderCards = () => render();

document.addEventListener('DOMContentLoaded', () => {
  Store.initPage('catalog');
  parseURL();
  renderFilters();

  document.getElementById('sort-select').value = state.sort;
  document.getElementById('sort-select').addEventListener('change', e => { state.sort = e.target.value; state.page = 1; updateURL(); render(); });
  document.getElementById('min-price').addEventListener('change', applyPrice);
  document.getElementById('max-price').addEventListener('change', applyPrice);
  document.getElementById('f-discount').addEventListener('change', e => toggleDiscount(e.target.checked));
  document.getElementById('f-new').addEventListener('change', e => toggleNew(e.target.checked));
  document.getElementById('f-hit').addEventListener('change', e => toggleHit(e.target.checked));

  render();
});
