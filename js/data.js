/* Datos del abecedario español y de los números.
   `voz` es el texto que se le pasa al sintetizador para que suene bien en español. */

const LETRAS = [
  { ch: 'A', voz: 'a',          palabra: 'Árbol',     emoji: '🌳' },
  { ch: 'B', voz: 'be',         palabra: 'Barco',     emoji: '⛵' },
  { ch: 'C', voz: 'ce',         palabra: 'Casa',      emoji: '🏠' },
  { ch: 'D', voz: 'de',         palabra: 'Dado',      emoji: '🎲' },
  { ch: 'E', voz: 'e',          palabra: 'Elefante',  emoji: '🐘' },
  { ch: 'F', voz: 'efe',        palabra: 'Flor',      emoji: '🌸' },
  { ch: 'G', voz: 'ge',         palabra: 'Gato',      emoji: '🐱' },
  { ch: 'H', voz: 'hache',      palabra: 'Helado',    emoji: '🍦' },
  { ch: 'I', voz: 'i',          palabra: 'Isla',      emoji: '🏝️' },
  { ch: 'J', voz: 'jota',       palabra: 'Jirafa',    emoji: '🦒' },
  { ch: 'K', voz: 'ka',         palabra: 'Koala',     emoji: '🐨' },
  { ch: 'L', voz: 'ele',        palabra: 'León',      emoji: '🦁' },
  { ch: 'M', voz: 'eme',        palabra: 'Mano',      emoji: '✋' },
  { ch: 'N', voz: 'ene',        palabra: 'Nube',      emoji: '☁️' },
  { ch: 'Ñ', voz: 'eñe',        palabra: 'Ñu',        emoji: '🐃' },
  { ch: 'O', voz: 'o',          palabra: 'Oso',       emoji: '🐻' },
  { ch: 'P', voz: 'pe',         palabra: 'Pato',      emoji: '🦆' },
  { ch: 'Q', voz: 'cu',         palabra: 'Queso',     emoji: '🧀' },
  { ch: 'R', voz: 'erre',       palabra: 'Ratón',     emoji: '🐭' },
  { ch: 'S', voz: 'ese',        palabra: 'Sol',       emoji: '☀️' },
  { ch: 'T', voz: 'te',         palabra: 'Tren',      emoji: '🚂' },
  { ch: 'U', voz: 'u',          palabra: 'Uvas',      emoji: '🍇' },
  { ch: 'V', voz: 'uve',        palabra: 'Vaca',      emoji: '🐮' },
  { ch: 'W', voz: 'uve doble',  palabra: 'Waffle',    emoji: '🧇' },
  { ch: 'X', voz: 'equis',      palabra: 'Xilófono',  emoji: '🎹' },
  { ch: 'Y', voz: 'ye',         palabra: 'Yate',      emoji: '🛥️' },
  { ch: 'Z', voz: 'zeta',       palabra: 'Zapato',    emoji: '👟' },
];

const NOMBRES_NUMERO = [
  'cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho',
  'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis',
  'diecisiete', 'dieciocho', 'diecinueve', 'veinte',
];

/* Un emoji distinto por número para que contar no sea siempre igual. */
const EMOJIS_CONTEO = ['🫧', '🍎', '🐥', '⭐', '⚽', '🍓', '🐞', '🎈', '🐟', '🍪',
                       '🦋', '🌻', '🐸', '🚗', '🍌', '🐝', '🐳', '🎁', '🌈', '🦄', '🍇'];

const NUMEROS = NOMBRES_NUMERO.map((nombre, n) => ({
  ch: String(n),
  voz: nombre,
  palabra: nombre.charAt(0).toUpperCase() + nombre.slice(1),
  emoji: EMOJIS_CONTEO[n],
  valor: n,
}));

const ELOGIOS = [
  '¡Muy bien!', '¡Genial!', '¡Perfecto!', '¡Lo lograste!', '¡Qué bien!',
  '¡Eso es!', '¡Fantástico!', '¡Campeón!', '¡Bravo!',
];

const ANIMOS = [
  'Casi. Prueba otra vez.', 'Inténtalo de nuevo.', 'Uy, esa no. Sigue buscando.',
];
