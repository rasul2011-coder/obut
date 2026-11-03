/* VYRON — Home Page Logic */

// Hero slider slides
const HERO_SLIDES = [
  {
    bg: `https://images.pexels.com/photos/10168171/pexels-photo-10168171.jpeg?auto=compress&cs=tinysrgb&w=1600`,
    tag: 'Новая коллекция 2026',
    title: 'БЕГ БЕЗ ГРАНИЦ',
    text: 'Инновационные технологии амортизации, невесомый верх и максимальный возврат энергии. Откройте новую эру бега с VYRON.',
    btn: 'Смотреть коллекцию',
    link: 'catalog.html?category=footwear',
  },
  {
    bg: `https://images.pexels.com/photos/34666257/pexels-photo-34666257.jpeg?auto=compress&cs=tinysrgb&w=1600`,
    tag: 'Trail-серия',
    title: 'ПОКОРЯЙ ТРОПЫ',
    text: 'Кроссовки для трейлраннинга с агрессивным протектором и защитой от любых погодных условий. Горы зовут — отвечай.',
    btn: 'Трейловые кроссовки',
    link: 'catalog.html?category=footwear&subcategory=trail',
  },
  {
    bg: `https://images.pexels.com/photos/6539913/pexels-photo-6539913.jpeg?auto=compress&cs=tinysrgb&w=1600`,
    tag: 'Для неё',
    title: 'АКТИВ БЕЗ КОМПРОМИССОВ',
    text: 'Женская спортивная коллекция: компрессия, поддержка, свобода движений. Для тренировок, которые вдохновляют.',
    btn: 'Женская коллекция',
    link: 'catalog.html?category=clothing',
  },
];

function renderHero() {
  const el = document.getElementById('hero-slider');
  if (!el) return;
  el.innerHTML = HERO_SLIDES.map((s, i) => `
    <div class="hero-slide ${i === 0 ? 'active' : ''}" data-slide="${i}">
      <div class="hero-slide__bg" style="background-image:url('${s.bg}')"></div>
      <div class="container">
        <div class="hero-slide__content">
          <div class="hero__tag">${s.tag}</div>
          <h1>${s.title}</h1>
          <p>${s.text}</p>
          <div class="hero__actions">
            <a href="${s.link}" class="btn btn--primary">${s.btn}</a>
            <a href="catalog.html" class="btn btn--white">Весь каталог</a>
          </div>
        </div>
      </div>
    </div>
  `).join('') + `
    <div class="hero-slider__dots">
      ${HERO_SLIDES.map((_, i) => `<div class="hero-slider__dot ${i === 0 ? 'active' : ''}" onclick="goSlide(${i})"></div>`).join('')}
    </div>`;
  startSlider();
}

let sliderTimer, currentSlide = 0;
function startSlider() {
  clearInterval(sliderTimer);
  sliderTimer = setInterval(() => goSlide((currentSlide + 1) % HERO_SLIDES.length), 5500);
}
function goSlide(n) {
  currentSlide = n;
  document.querySelectorAll('.hero-slide').forEach((s, i) => s.classList.toggle('active', i === n));
  document.querySelectorAll('.hero-slider__dot').forEach((d, i) => d.classList.toggle('active', i === n));
  startSlider();
}

function renderCategories() {
  const el = document.getElementById('category-grid');
  if (!el) return;
  const cats = [
    { id: 'footwear',   name: 'Обувь',          img: `https://images.pexels.com/photos/797637/pexels-photo-797637.jpeg?auto=compress&cs=tinysrgb&w=600`, count: Store.filterProducts({ category: 'footwear' }).length },
    { id: 'clothing',   name: 'Одежда',         img: `https://images.pexels.com/photos/8422780/pexels-photo-8422780.jpeg?auto=compress&cs=tinysrgb&w=600`, count: Store.filterProducts({ category: 'clothing' }).length },
    { id: 'accessories',name: 'Аксессуары',     img: `https://images.pexels.com/photos/33034333/pexels-photo-33034333.jpeg?auto=compress&cs=tinysrgb&w=600`, count: Store.filterProducts({ category: 'accessories' }).length },
    { id: 'equipment',  name: 'Спортинвентарь', img: `https://images.pexels.com/photos/8612034/pexels-photo-8612034.jpeg?auto=compress&cs=tinysrgb&w=600`, count: Store.filterProducts({ category: 'equipment' }).length },
  ];
  el.innerHTML = cats.map(c => `
    <a href="catalog.html?category=${c.id}" class="category-card">
      <div class="category-card__bg" style="background-image:url('${c.img}')"></div>
      <div class="category-card__label">
        <h3>${c.name}</h3>
        <span>${c.count} товаров →</span>
      </div>
    </a>`).join('');
}

function renderHits() {
  const el = document.getElementById('hit-products');
  if (!el) return;
  const items = Store.filterProducts({ onlyHit: true }).slice(0, 4);
  el.innerHTML = items.map(Store.productCard).join('');
}

function renderNew() {
  const el = document.getElementById('new-products');
  if (!el) return;
  const items = Store.filterProducts({ onlyNew: true }).slice(0, 4);
  el.innerHTML = items.map(Store.productCard).join('');
}

function renderSale() {
  const el = document.getElementById('sale-products');
  if (!el) return;
  const items = Store.filterProducts({ onlyDiscount: true, sort: 'discount' }).slice(0, 4);
  el.innerHTML = items.map(Store.productCard).join('');
}

function renderPromoBanner() {
  const el = document.getElementById('promo-banner');
  if (!el) return;
  el.innerHTML = `
    <div class="promo-banner__content">
      <div class="hero__tag">Black Week</div>
      <h2>СКИДКИ ДО 50%</h2>
      <p>Используйте промокод при оформлении заказа и получите дополнительную скидку на весь ассортимент.</p>
      <div class="promo-code-box">
        <span style="color:#fff;font-size:14px">Код:</span>
        <code>SPORT20</code>
        <button class="btn btn--primary btn--sm" onclick="copyCode('SPORT20')">Копировать</button>
      </div>
    </div>
    <div class="promo-banner__img" style="background-image:url('https://images.pexels.com/photos/1464624/pexels-photo-1464624.jpeg?auto=compress&cs=tinysrgb&w=800')"></div>`;
}

function renderPromoCodes() {
  const el = document.getElementById('promo-codes');
  if (!el) return;
  el.innerHTML = Store.PROMO_CODES.map(p => `
    <div class="promo-card">
      <div class="promo-card__icon">${p.type === 'percent' ? '🎁' : '💰'}</div>
      <div class="promo-card__code">${p.code}</div>
      <div class="promo-card__desc">${p.desc}</div>
      <button class="btn btn--primary btn--sm promo-card__copy" onclick="copyCode('${p.code}')">Копировать код</button>
    </div>`).join('');
}

function copyCode(code) {
  navigator.clipboard?.writeText(code).then(() => Store.toast('Промокод скопирован: ' + code, 'success'))
    .catch(() => Store.toast('Промокод: ' + code, 'success'));
}

// Global renderCards for re-rendering product grids after favorite toggle
window.renderCards = () => {
  renderHits();
  renderNew();
  renderSale();
};

// Init
document.addEventListener('DOMContentLoaded', () => {
  Store.initPage('index');
  renderHero();
  renderCategories();
  renderHits();
  renderPromoBanner();
  renderNew();
  renderPromoCodes();
  renderSale();
});
