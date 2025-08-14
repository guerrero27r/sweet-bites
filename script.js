const STATE = {
  carrito: [],
  productoActual: null,
  productos: [],
  categoria: 'Todos',
  numeroWhatsApp: '573015541060', // <-- Cambia por tu número con indicativo
};

const fmtCOP = (n) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n);

document.addEventListener('DOMContentLoaded', async () => {
  await cargarProductos();
  initUI();
  renderFiltros();
  renderProductos();
  wireCart();
  wireModal();
  mobileFixes();
});

async function cargarProductos() {
  const res = await fetch('./products.json');
  STATE.productos = await res.json();
}

function initUI() {
  document.getElementById('fab').addEventListener('click', toggleCarrito);
  document.getElementById('closeCart').addEventListener('click', toggleCarrito);
  document
    .getElementById('keepShopping')
    .addEventListener('click', toggleCarrito);
  document
    .getElementById('sendWhatsapp')
    .addEventListener('click', enviarWhatsApp);
}

function renderFiltros() {
  const filters = document.getElementById('filters');
  const cats = ['Todos', ...new Set(STATE.productos.map((p) => p.category))];
  filters.innerHTML = '';
  cats.forEach((cat) => {
    const btn = document.createElement('button');
    btn.className = 'filter' + (STATE.categoria === cat ? ' active' : '');
    btn.textContent = cat;
    btn.onclick = () => {
      STATE.categoria = cat;
      renderFiltros();
      renderProductos();
    };
    filters.appendChild(btn);
  });
}

function renderProductos() {
  const grid = document.getElementById('productGrid');
  grid.innerHTML = '';
  const list =
    STATE.categoria === 'Todos'
      ? STATE.productos
      : STATE.productos.filter((p) => p.category === STATE.categoria);
  list.forEach((p) => grid.appendChild(crearCard(p)));
}

function crearCard(p) {
  const card = document.createElement('article');
  card.className = 'card';
  card.innerHTML = `
    <div class="card__image"><img src="${p.image}" alt="${
    p.name
  }" loading="lazy" /></div>
    <div class="card__body">
      <h3 class="card__title">${p.name}</h3>
      <p class="card__desc">${p.description || ''}</p>
      <span class="tag">Desde <strong>${fmtCOP(p.basePrice)}</strong></span>
      <div style="height:10px"></div>
      <button class="btn btn--primary">Pedir por WhatsApp</button>
    </div>`;
  card.querySelector('button').onclick = () => abrirModal(p);
  return card;
}

/* ===== Modal ===== */
function wireModal() {
  document.getElementById('closeModal').onclick = cerrarModal;
  document.getElementById('cancelModal').onclick = cerrarModal;
  document.getElementById('addToCart').onclick = agregarAlCarrito;
}
function abrirModal(p) {
  STATE.productoActual = p;
  document.getElementById('modalProducto').textContent = p.name;
  const sel = document.getElementById('modalTamano');
  sel.innerHTML = '';
  p.sizes.forEach((s) => {
    const opt = document.createElement('option');
    opt.value = s.name;
    opt.dataset.extra = s.add || 0;
    opt.textContent = `${s.name} — ${fmtCOP(p.basePrice + (s.add || 0))}`;
    sel.appendChild(opt);
  });
  const tops = document.getElementById('toppingsList');
  tops.innerHTML = '';
  (p.toppings || []).forEach((t) => {
    const id = Math.random().toString(36).slice(2);
    const item = document.createElement('label');
    item.className = 'opt';
    item.innerHTML = `<input type="checkbox" value="${t.name}" data-precio="${
      t.add || 0
    }"> ${t.name} (+${fmtCOP(t.add || 0)})`;
    tops.appendChild(item);
  });
  document.getElementById('modal').classList.add('open');
  document.getElementById('modal').setAttribute('aria-hidden', 'false');
}
function cerrarModal() {
  document.getElementById('modal').classList.remove('open');
  document.getElementById('modal').setAttribute('aria-hidden', 'true');
}

/* ===== Carrito ===== */
function wireCart() {
  // nada adicional por ahora
}
function abrirCarrito() {
  document.getElementById('cart').classList.add('open');
  document.getElementById('cart').setAttribute('aria-hidden', 'false');
}
function toggleCarrito() {
  const c = document.getElementById('cart');
  c.classList.toggle('open');
  c.setAttribute(
    'aria-hidden',
    c.classList.contains('open') ? 'false' : 'true'
  );
}

function agregarAlCarrito() {
  const p = STATE.productoActual;
  if (!p) return;
  const sel = document.getElementById('modalTamano');
  const sizeName = sel.value;
  const sizeAdd = parseInt(sel.selectedOptions[0].dataset.extra || '0', 10);
  let precio = p.basePrice + sizeAdd;
  const extras = [];
  document
    .querySelectorAll('#toppingsList input[type=checkbox]:checked')
    .forEach((x) => {
      extras.push(x.value);
      precio += parseInt(x.dataset.precio || '0', 10);
    });
  STATE.carrito.push({ producto: p.name, tamano: sizeName, extras, precio });
  actualizarCarrito();
  cerrarModal();
  abrirCarrito();
}

function actualizarCarrito() {
  const ul = document.getElementById('listaCarrito');
  ul.innerHTML = '';
  let total = 0;
  STATE.carrito.forEach((it, idx) => {
    total += it.precio;
    const li = document.createElement('li');
    li.className = 'cart__item';
    li.innerHTML = `
      <div>
        <div><strong>${it.producto}</strong> (${it.tamano})</div>
        <small>Extras: ${it.extras.length ? it.extras.join(', ') : '—'}</small>
        <div class="price">${fmtCOP(it.precio)}</div>
      </div>
      <div><button class="rmv" aria-label="Quitar" onclick="eliminarItem(${idx})">Quitar</button></div>`;
    ul.appendChild(li);
  });
  document.getElementById('total').textContent = fmtCOP(total);
  document.getElementById('badge').textContent = STATE.carrito.length;
}

function eliminarItem(index) {
  STATE.carrito.splice(index, 1);
  actualizarCarrito();
}

function enviarWhatsApp() {
  if (STATE.carrito.length === 0) {
    alert('Tu carrito está vacío. Agrega al menos un producto.');
    return;
  }
  const nombre = document.getElementById('nombre').value.trim();
  const tel = document.getElementById('telefono').value.trim();
  const dir = document.getElementById('direccion').value.trim();
  if (!nombre || !tel || !dir) {
    alert('Por favor completa nombre, teléfono y dirección.');
    return;
  }

  let texto =
    `*Nuevo pedido*\n` +
    `Nombre: ${nombre}\n` +
    `Teléfono: ${tel}\n` +
    `Dirección: ${dir}\n\n`;

  STATE.carrito.forEach((it, i) => {
    texto += `${i + 1}. ${it.producto} (${it.tamano}) — Extras: ${
      it.extras.length ? it.extras.join(', ') : '—'
    } — ${fmtCOP(it.precio)}\n`;
  });
  const total = document.getElementById('total').textContent;
  texto += `\n*Total:* ${total}`;

  const url = `https://wa.me/${STATE.numeroWhatsApp}?text=${encodeURIComponent(
    texto
  )}`;
  window.open(url, '_blank');
}

/* ===== Mobile UX fixes ===== */
function mobileFixes() {
  // Mantener footer visible y desplazar inputs al foco en móviles
  const inputs = ['nombre', 'telefono', 'direccion'].map((id) =>
    document.getElementById(id)
  );
  inputs.forEach((inp) => {
    inp.addEventListener('focus', () => {
      // Asegura que el input quede a la vista sobre el teclado
      document.getElementById('cart').scrollTop = inp.offsetTop - 20;
      setTimeout(
        () => inp.scrollIntoView({ block: 'center', behavior: 'smooth' }),
        100
      );
    });
  });

  // Evitar zoom en iOS al tocar inputs (sugerencia: usar font-size >= 16px)
  inputs.forEach((inp) => (inp.style.fontSize = '16px'));
}
