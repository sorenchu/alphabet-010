/* ===========================================================
   A jugar con las letras — lógica de la aplicación
   =========================================================== */

const $  = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const COLORES = ['--rosa', '--naranja', '--verde', '--azul', '--morado'];
const azar    = (arr) => arr[Math.floor(Math.random() * arr.length)];
const mezclar = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/* ─────────────────────────── ajustes ─────────────────────────── */

const AJUSTES_POR_DEFECTO = { caso: 'ambas', maxNumero: 10, opciones: 2, voz: 'si' };
let ajustes = { ...AJUSTES_POR_DEFECTO };

function cargarAjustes() {
  try {
    const guardado = JSON.parse(localStorage.getItem('abc123') || '{}');
    ajustes = { ...AJUSTES_POR_DEFECTO, ...guardado };
  } catch (_) { /* si no hay almacenamiento, usamos los valores por defecto */ }
  ajustes.maxNumero = Number(ajustes.maxNumero) || 10;
  ajustes.opciones  = Number(ajustes.opciones) || 2;
  Voz.activar(ajustes.voz === 'si');
}

function guardarAjustes() {
  try { localStorage.setItem('abc123', JSON.stringify(ajustes)); } catch (_) {}
}

/* ─────────────────────────── navegación ─────────────────────────── */

const PANTALLAS = {
  home:     '#screen-home',
  letras:   '#screen-explorar',
  numeros:  '#screen-explorar',
  juego:    '#screen-juego',
  dibujo:   '#screen-dibujo',
};

let pantallaActual = 'home';

function ir(destino) {
  Voz.callar();
  cancelarConteo();
  pantallaActual = destino;
  $$('.screen').forEach((s) => s.classList.remove('is-active'));
  $(PANTALLAS[destino]).classList.add('is-active');

  if (destino === 'letras' || destino === 'numeros') {
    explorar.tipo = destino === 'letras' ? 'letras' : 'numeros';
    explorar.i = 0;
    pintarTira();
    pintarTarjeta({ hablar: true });
  } else if (destino === 'juego') {
    juego.aciertos = 0;
    pintarEstrellas();
    nuevaRonda();
  } else if (destino === 'dibujo') {
    ajustarLienzo();
    pintarDibujo();
  }
}

$$('[data-ir]').forEach((b) => b.addEventListener('click', () => ir(b.dataset.ir)));

/* ─────────────────────────── explorar ─────────────────────────── */

const explorar = { tipo: 'letras', i: 0 };

const elGlifo   = $('#glifo');
const elEmoji   = $('#emoji');
const elPalabra = $('#palabra');
const elPies    = $('#pies');
const elConteo  = $('#conteo');
const elTarjeta = $('#tarjeta');
const elTira    = $('#tira');

const mazoNumeros = () => NUMEROS.slice(0, ajustes.maxNumero + 1);
const mazo = () => (explorar.tipo === 'letras' ? LETRAS : mazoNumeros());
const actual = () => mazo()[explorar.i];

/* Devuelve el HTML del glifo según el ajuste de mayúsculas/minúsculas. */
function htmlGlifo(item, caso = ajustes.caso) {
  if (item.valor !== undefined) return item.ch;       // los números no tienen caso
  const may = item.ch;
  const min = item.ch.toLowerCase();
  if (caso === 'mayus') return may;
  if (caso === 'minus') return `<span class="minus">${min}</span>`;
  return `${may}<span class="minus">${min}</span>`;
}

function textoGlifo(item, caso = ajustes.caso) {
  if (item.valor !== undefined) return item.ch;
  return caso === 'minus' ? item.ch.toLowerCase() : item.ch;
}

function pintarTarjeta({ hablar = false } = {}) {
  const item = actual();
  const esNumero = item.valor !== undefined;

  elGlifo.innerHTML = htmlGlifo(item);
  elGlifo.style.setProperty('--color-actual', `var(${COLORES[explorar.i % COLORES.length]})`);

  if (esNumero) {
    elPies.hidden = true;
    elConteo.hidden = false;
    elConteo.style.setProperty('--cols', Math.min(Math.max(item.valor, 1), 5));
    elConteo.innerHTML = Array.from(
      { length: item.valor }, () => `<span>${item.emoji}</span>`
    ).join('');
    if (item.valor === 0) elConteo.innerHTML = '<span class="visible">🕳️</span>';
  } else {
    elConteo.hidden = true;
    elPies.hidden = false;
    elEmoji.textContent = item.emoji;
    elPalabra.textContent = item.palabra;
  }

  elTarjeta.classList.remove('pulso');
  void elTarjeta.offsetWidth;          // reinicia la animación
  elTarjeta.classList.add('pulso');

  marcarTira();
  if (hablar) decirActual();
}

function decirActual() {
  const item = actual();
  if (item.valor !== undefined) {
    contar(item.valor);
  } else {
    Voz.hablar(`${item.voz}. ${item.voz} de ${item.palabra}`);
  }
}

/* Contar en voz alta haciendo saltar cada dibujito. */
let conteoToken = 0;
function cancelarConteo() { conteoToken++; }

async function contar(n) {
  cancelarConteo();
  const mio = conteoToken;
  const puntos = Array.from(elConteo.children);
  puntos.forEach((p) => p.classList.remove('visible', 'saltando'));

  await Voz.hablar(NOMBRES_NUMERO[n]);
  if (mio !== conteoToken) return;
  if (n === 0) { elConteo.firstElementChild?.classList.add('visible'); return; }

  for (let k = 0; k < n; k++) {
    if (mio !== conteoToken) return;
    const p = puntos[k];
    if (p) { p.classList.add('visible', 'saltando'); }
    Voz.hablar(NOMBRES_NUMERO[k + 1], { rate: 0.95 });
    await new Promise((r) => setTimeout(r, 520));
    p?.classList.remove('saltando');
  }
}

function mover(paso) {
  const n = mazo().length;
  explorar.i = (explorar.i + paso + n) % n;
  pintarTarjeta({ hablar: true });
}

function pintarTira() {
  elTira.innerHTML = '';
  mazo().forEach((item, i) => {
    const b = document.createElement('button');
    b.textContent = textoGlifo(item, ajustes.caso === 'minus' ? 'minus' : 'mayus');
    b.addEventListener('click', () => { explorar.i = i; pintarTarjeta({ hablar: true }); });
    elTira.appendChild(b);
  });
  marcarTira();
}

function marcarTira() {
  Array.from(elTira.children).forEach((b, i) => {
    const esta = i === explorar.i;
    b.classList.toggle('actual', esta);
    if (esta) b.scrollIntoView({ inline: 'center', block: 'nearest' });
  });
}

$('#btn-antes').addEventListener('click', () => mover(-1));
$('#btn-despues').addEventListener('click', () => mover(1));
elTarjeta.addEventListener('click', decirActual);
$('#btn-repetir').addEventListener('click', decirActual);

$('#btn-caso').addEventListener('click', () => {
  const orden = ['ambas', 'mayus', 'minus'];
  ajustes.caso = orden[(orden.indexOf(ajustes.caso) + 1) % orden.length];
  guardarAjustes();
  actualizarBotonCaso();
  pintarTira();
  pintarTarjeta();
});

function actualizarBotonCaso() {
  $('#btn-caso').innerHTML =
    ajustes.caso === 'mayus' ? 'A' : ajustes.caso === 'minus' ? 'a' : 'Aa';
}

/* deslizar con el dedo */
function activarDeslizar(zona, alDeslizar) {
  let x0 = null, y0 = null;
  zona.addEventListener('touchstart', (e) => {
    x0 = e.touches[0].clientX; y0 = e.touches[0].clientY;
  }, { passive: true });
  zona.addEventListener('touchend', (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    const dy = e.changedTouches[0].clientY - y0;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) alDeslizar(dx < 0 ? 1 : -1);
    x0 = y0 = null;
  }, { passive: true });
}
activarDeslizar($('#screen-explorar'), mover);

/* ─────────────────────────── juego ─────────────────────────── */

const juego = { tipo: 'letras', objetivo: null, aciertos: 0, ronda: 0, bloqueado: false };

const elOpciones = $('#opciones');
const elConsigna = $('#consigna-glifo');

function pilaJuego() {
  return juego.tipo === 'letras' ? LETRAS : mazoNumeros().filter((n) => n.valor > 0);
}

function nuevaRonda() {
  juego.bloqueado = false;
  juego.ronda++;

  const pila = pilaJuego();
  const n = Math.min(ajustes.opciones, pila.length);
  const elegidos = mezclar(pila).slice(0, n);
  // Evitamos repetir el mismo objetivo dos veces seguidas si se puede.
  let objetivo = azar(elegidos);
  if (elegidos.length > 1 && juego.objetivo && objetivo.ch === juego.objetivo.ch) {
    objetivo = azar(elegidos.filter((x) => x.ch !== objetivo.ch));
  }
  juego.objetivo = objetivo;

  // Con "ambas", la consigna va en mayúscula y las opciones alternan de caso:
  // así el niño aprende que A y a son la misma letra.
  const casoConsigna = ajustes.caso === 'minus' ? 'minus' : 'mayus';
  const casoOpciones = ajustes.caso !== 'ambas'
    ? ajustes.caso
    : (juego.ronda % 2 === 0 ? 'mayus' : 'minus');

  elConsigna.innerHTML = textoGlifo(objetivo, casoConsigna);

  elOpciones.dataset.n = n;
  elOpciones.innerHTML = '';
  elegidos.forEach((item) => {
    const b = document.createElement('button');
    b.className = 'opcion';
    b.innerHTML = textoGlifo(item, casoOpciones);
    b.addEventListener('click', () => responder(item, b));
    elOpciones.appendChild(b);
  });

  decirConsigna();
}

function decirConsigna() {
  const o = juego.objetivo;
  if (!o) return;
  if (o.valor !== undefined) Voz.hablar(`¿Dónde está el ${o.voz}?`);
  else Voz.hablar(`¿Dónde está la ${o.voz}?`);
}

async function responder(item, boton) {
  if (juego.bloqueado) return;

  if (item.ch !== juego.objetivo.ch) {
    boton.classList.add('mal');
    setTimeout(() => boton.classList.remove('mal'), 450);
    boton.classList.add('apagada');
    Voz.hablar(azar(ANIMOS));
    return;
  }

  juego.bloqueado = true;
  boton.classList.add('bien');
  juego.aciertos++;
  pintarEstrellas();
  confeti(juego.aciertos >= 5 ? 40 : 12);

  const o = juego.objetivo;
  await Voz.hablar(`${azar(ELOGIOS)} ${o.valor !== undefined ? 'El' : 'La'} ${o.voz}.`);

  if (juego.aciertos >= 5) {
    juego.aciertos = 0;
    confeti(60);
    await Voz.hablar('¡Conseguiste cinco estrellas! ¡Eres un campeón!');
    pintarEstrellas();
  }
  if (pantallaActual === 'juego') nuevaRonda();
}

function pintarEstrellas() {
  $('#estrellas').innerHTML = Array.from({ length: 5 }, (_, i) =>
    `<span class="${i < juego.aciertos ? 'on' : ''}">⭐</span>`).join('');
}

$('#consigna').addEventListener('click', decirConsigna);
$('#btn-juego-tipo').addEventListener('click', () => {
  juego.tipo = juego.tipo === 'letras' ? 'numeros' : 'letras';
  $('#btn-juego-tipo').textContent = juego.tipo === 'letras' ? '🔤' : '🔢';
  juego.objetivo = null;
  nuevaRonda();
});

/* ─────────────────────────── dibujar ─────────────────────────── */

const TINTAS = ['#ff4f81', '#ff9c2b', '#39b36b', '#2f9fe0', '#8a63ff', '#3b3358'];
const dibujo = { i: 0, color: TINTAS[0], trazos: [], trazoActual: null };

const lienzo   = $('#lienzo');
const ctx      = lienzo.getContext('2d');
const fantasma = $('#lienzo-fantasma');

const mazoDibujo = () => LETRAS.concat(mazoNumeros().filter((n) => n.valor > 0));

function pintarDibujo() {
  const item = mazoDibujo()[dibujo.i];
  fantasma.innerHTML = htmlGlifo(item, ajustes.caso === 'ambas' ? 'mayus' : ajustes.caso);
  dibujo.trazos = [];
  redibujar();
}

function ajustarLienzo() {
  const caja = $('#lienzo-caja').getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  lienzo.width  = Math.max(1, Math.round(caja.width  * dpr));
  lienzo.height = Math.max(1, Math.round(caja.height * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  redibujar();
}

function redibujar() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = lienzo.width / dpr, h = lienzo.height / dpr;
  ctx.clearRect(0, 0, w, h);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const trazo of dibujo.trazos) {
    if (trazo.pts.length < 1) continue;
    ctx.strokeStyle = trazo.color;
    ctx.lineWidth = trazo.grosor;
    ctx.beginPath();
    trazo.pts.forEach((p, i) => {
      const x = p[0] * w, y = p[1] * h;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    if (trazo.pts.length === 1) ctx.lineTo(trazo.pts[0][0] * w + .1, trazo.pts[0][1] * h);
    ctx.stroke();
  }
}

function puntoNormalizado(e) {
  const r = lienzo.getBoundingClientRect();
  return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height];
}

lienzo.addEventListener('pointerdown', (e) => {
  lienzo.setPointerCapture(e.pointerId);
  const grosor = Math.max(12, Math.min(lienzo.clientWidth, lienzo.clientHeight) * 0.045);
  dibujo.trazoActual = { color: dibujo.color, grosor, pts: [puntoNormalizado(e)] };
  dibujo.trazos.push(dibujo.trazoActual);
  redibujar();
});

lienzo.addEventListener('pointermove', (e) => {
  if (!dibujo.trazoActual) return;
  dibujo.trazoActual.pts.push(puntoNormalizado(e));
  redibujar();
});

['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) =>
  lienzo.addEventListener(ev, () => { dibujo.trazoActual = null; }));

function moverDibujo(paso) {
  const n = mazoDibujo().length;
  dibujo.i = (dibujo.i + paso + n) % n;
  pintarDibujo();
  const item = mazoDibujo()[dibujo.i];
  Voz.hablar(item.valor !== undefined ? item.voz : `${item.voz}. Dibuja la ${item.voz}`);
}

$('#btn-dib-antes').addEventListener('click', () => moverDibujo(-1));
$('#btn-dib-despues').addEventListener('click', () => moverDibujo(1));
$('#btn-borrar').addEventListener('click', () => { dibujo.trazos = []; redibujar(); });

function pintarPaletaColores() {
  const cont = $('#colores');
  cont.innerHTML = '';
  TINTAS.forEach((c, i) => {
    const b = document.createElement('button');
    b.className = 'color' + (i === 0 ? ' activo' : '');
    b.style.background = c;
    b.setAttribute('aria-label', 'Color');
    b.addEventListener('click', () => {
      dibujo.color = c;
      Array.from(cont.children).forEach((x) => x.classList.remove('activo'));
      b.classList.add('activo');
    });
    cont.appendChild(b);
  });
}

window.addEventListener('resize', () => {
  if (pantallaActual === 'dibujo') ajustarLienzo();
});

/* ─────────────────────────── confeti ─────────────────────────── */

const CHISPAS = ['⭐', '🎉', '✨', '🌈', '🎈', '💫', '🍭'];

function confeti(cantidad = 20) {
  const caja = $('#fiesta');
  for (let i = 0; i < cantidad; i++) {
    const s = document.createElement('span');
    s.className = 'chispa';
    s.textContent = azar(CHISPAS);
    s.style.left = Math.random() * 100 + 'vw';
    s.style.fontSize = (1.2 + Math.random() * 2) + 'rem';
    s.style.setProperty('--giro', (Math.random() * 720 - 360) + 'deg');
    const dur = 1.8 + Math.random() * 1.4;
    s.style.animationDuration = dur + 's';
    s.style.animationDelay = (Math.random() * 0.4) + 's';
    caja.appendChild(s);
    setTimeout(() => s.remove(), (dur + 0.6) * 1000);
  }
}

/* ─────────────────────────── ajustes (adultos) ─────────────────────────── */

const modal = $('#modal-ajustes');
let tempAjustes = null;

$('#btn-ajustes').addEventListener('pointerdown', (e) => {
  e.preventDefault();
  tempAjustes = setTimeout(abrirAjustes, 800);   // pulsación larga: el niño no la encuentra
});
['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) =>
  $('#btn-ajustes').addEventListener(ev, () => clearTimeout(tempAjustes)));

function abrirAjustes() {
  modal.hidden = false;
  marcarOpcionesAjustes();
  $('#pista-voz').textContent = !Voz.disponible
    ? 'Este navegador no tiene síntesis de voz.'
    : Voz.tieneVozEspanola
      ? `Voz en uso: ${Voz.nombreVoz}`
      : 'No se encontró ninguna voz en español. En Linux puedes instalar «espeak-ng» o añadir voces en la configuración del sistema; en Android/iOS, en Ajustes → Accesibilidad → Voz.';
}

function marcarOpcionesAjustes() {
  $$('.ops').forEach((grupo) => {
    const clave = grupo.dataset.ajuste;
    Array.from(grupo.children).forEach((b) => {
      b.classList.toggle('sel', String(ajustes[clave]) === b.dataset.valor);
    });
  });
}

$$('.ops').forEach((grupo) => {
  grupo.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const clave = grupo.dataset.ajuste;
    const valor = b.dataset.valor;
    ajustes[clave] = /^\d+$/.test(valor) ? Number(valor) : valor;
    if (clave === 'voz') Voz.activar(ajustes.voz === 'si');
    guardarAjustes();
    marcarOpcionesAjustes();
    actualizarBotonCaso();
  });
});

$('#btn-cerrar-ajustes').addEventListener('click', () => {
  modal.hidden = true;
  if (explorar.i >= mazo().length) explorar.i = 0;
  if (pantallaActual === 'letras' || pantallaActual === 'numeros') {
    pintarTira();
    pintarTarjeta();
  }
  if (pantallaActual === 'juego') nuevaRonda();
  if (pantallaActual === 'dibujo') { dibujo.i = 0; pintarDibujo(); }
});

/* ─────────────────────────── teclado ─────────────────────────── */

document.addEventListener('keydown', (e) => {
  if (!modal.hidden) return;

  if (e.key === 'Escape') { ir('home'); return; }

  if (pantallaActual === 'letras' || pantallaActual === 'numeros') {
    if (e.key === 'ArrowLeft')  { mover(-1); return; }
    if (e.key === 'ArrowRight') { mover(1);  return; }
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); decirActual(); return; }

    const tecla = e.key.toUpperCase();
    const i = mazo().findIndex((x) => x.ch === tecla);
    if (i >= 0) { explorar.i = i; pintarTarjeta({ hablar: true }); }
  } else if (pantallaActual === 'dibujo') {
    if (e.key === 'ArrowLeft')  moverDibujo(-1);
    if (e.key === 'ArrowRight') moverDibujo(1);
  }
});

/* ─────────────────────────── arranque ─────────────────────────── */

cargarAjustes();
actualizarBotonCaso();
pintarPaletaColores();
pintarEstrellas();
pintarTira();
pintarTarjeta();

// Un saludo la primera vez que se toca la pantalla, pero solo si el toque no
// abre nada (así no cortamos lo que diga la pantalla a la que se entra).
// Los navegadores no permiten reproducir sonido antes de una interacción.
let saludado = false;
document.addEventListener('pointerdown', (e) => {
  if (saludado) return;
  saludado = true;
  if (e.target.closest('button')) return;
  Voz.hablar('¡Hola! ¿Jugamos?');
});

// Guarda la app para poder jugar sin conexión (solo si se sirve por http/https).
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

// Permite abrir directamente una pantalla con la dirección: index.html#juego
if (PANTALLAS[location.hash.slice(1)]) ir(location.hash.slice(1));
