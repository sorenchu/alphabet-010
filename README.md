# ¡A jugar con las letras! 🅰️ 1️⃣

Aplicación educativa para que un niño o niña de tres años reconozca **letras
mayúsculas y minúsculas** y **números**. No hace falta saber leer para usarla:
todo es voz, dibujos y botones grandes.

## Cómo se abre

- **Lo más rápido:** doble clic en `index.html` (se abre en el navegador).
- **Recomendado** (permite instalarla y jugar sin conexión):

  ```bash
  cd /home/antonio/Projects/alphabet-010
  python3 -m http.server 8000
  ```

  y abrir `http://localhost:8000` en el navegador. En un móvil o tableta, desde
  el menú del navegador → «Añadir a la pantalla de inicio»: queda como una app a
  pantalla completa y funciona sin internet.

No hay que instalar nada, ni hay dependencias ni publicidad. Todo funciona sin
conexión y no se envía ningún dato a ninguna parte.

## Qué hay dentro

| Pantalla | Qué hace |
|---|---|
| 🔤 **Letras** | Las 27 letras del abecedario (incluida la Ñ) con su dibujo y su palabra: «A, a de Árbol». Al tocar la tarjeta lo repite. |
| 🔢 **Números** | Del 0 al 10 (o al 5 / 20, configurable). Al tocarlos cuenta en voz alta y los dibujitos van saltando de uno en uno. |
| 🎯 **Encuentra** | Juego de escucha: «¿Dónde está la A?». Se acierta tocando la letra correcta. Con 2, 3 o 4 opciones. Cada 5 aciertos, ¡fiesta de confeti! El botón de arriba a la derecha cambia de juego: 🔤 letras, 🔢 números y ↔️ **¿qué número va en medio?** («3 ? 5» → 4; al acertar cuenta los tres seguidos). |
| ✏️ **Dibuja** | Repasar con el dedo la letra o el número que aparece de fondo, en seis colores. |

### Detalles pensados para tres años

- **Sin castigos:** al fallar no se pierde nada, la app anima a intentarlo otra
  vez y la opción equivocada se atenúa para reducir el problema.
- **Mayúsculas y minúsculas juntas** (`Aa`) para que se vea que son la misma
  letra; en el juego la pregunta aparece en mayúscula y las opciones alternan
  entre mayúscula y minúscula, que es justo lo que cuesta aprender.
- **Voz en español** con la síntesis de voz del sistema. Si el equipo no tiene
  ninguna voz en español, la app funciona igual pero en silencio.
- Nada de menús de texto, ni anuncios, ni compras, ni salidas a internet.

## Ajustes (para la persona adulta)

Mantener pulsado el engranaje ⚙️ de la esquina superior derecha de la pantalla
de inicio **durante un segundo** (así el niño no entra sin querer). Se puede
elegir:

- cómo se muestran las letras: `A a`, solo `A` o solo `a`;
- hasta qué número: 5, 10 o 20;
- cuántas opciones tiene el juego: 2, 3 o 4 (empezar con 2);
- dificultad del juego: 🐣 **Fácil** (por defecto) o 🦊 **Difícil**, para cuando
  ya domine lo básico. En difícil la pregunta solo se oye (en lugar de «¿Dónde
  está la A?» se ve «¿Dónde está la ?»), las opciones se parecen entre sí
  (b/d/p/q, m/n/ñ, E/F, números vecinos, 6/9…) y en «¿qué número va?» el hueco
  puede ir antes, en medio o después («? 4 5», «3 ? 5», «3 4 ?»);
- voz encendida o apagada.

Los ajustes se guardan en el propio navegador.

## Atajos de teclado

Útiles si se usa con ordenador: `←` y `→` cambian de ficha, la **barra
espaciadora** repite el sonido, pulsar una **letra o un número** salta
directamente a esa ficha y `Esc` vuelve al inicio.

## Estructura

```
index.html        una página con las cuatro pantallas
css/styles.css    estilos (todo se adapta al tamaño de la pantalla)
js/data.js        abecedario, palabras, dibujos y nombres de los números
js/speech.js      voz en español
js/app.js         lógica de las pantallas y de los juegos
sw.js             caché para jugar sin conexión
manifest.json     para instalarla como app
```

Para cambiar una palabra o un dibujo basta con editar `js/data.js`.
