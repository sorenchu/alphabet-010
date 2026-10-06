/* Voz en español con la síntesis de voz del navegador.
   Si el equipo no tiene ninguna voz instalada, la app sigue funcionando en silencio. */

const Voz = (() => {
  const sintesis = window.speechSynthesis || null;
  let vozEs = null;
  let activa = true;
  let colaId = 0;

  function elegirVoz() {
    if (!sintesis) return;
    const voces = sintesis.getVoices();
    if (!voces.length) return;
    const puntua = (v) => {
      const lang = (v.lang || '').toLowerCase().replace('_', '-');
      if (!lang.startsWith('es')) return -1;
      let p = 1;
      if (lang === 'es-es') p += 3;          // castellano primero
      else if (lang.startsWith('es-')) p += 2;
      if (/female|mujer|mónica|monica|helena|laura|paulina/i.test(v.name)) p += 2;
      if (v.localService) p += 1;
      return p;
    };
    vozEs = voces
      .map((v) => ({ v, p: puntua(v) }))
      .filter((x) => x.p > 0)
      .sort((a, b) => b.p - a.p)
      .map((x) => x.v)[0] || null;
  }

  if (sintesis) {
    elegirVoz();
    sintesis.addEventListener('voiceschanged', elegirVoz);
    // Algunos navegadores tardan en publicar la lista de voces.
    setTimeout(elegirVoz, 300);
    setTimeout(elegirVoz, 1500);
  }

  function hablar(texto, opciones = {}) {
    if (!sintesis || !activa || !texto) return Promise.resolve();
    const { rate = 0.85, pitch = 1.15, encolar = false } = opciones;
    if (!encolar) sintesis.cancel();

    const u = new SpeechSynthesisUtterance(texto);
    u.lang = (vozEs && vozEs.lang) || 'es-ES';
    if (vozEs) u.voice = vozEs;
    u.rate = rate;
    u.pitch = pitch;
    u.volume = 1;

    const id = ++colaId;
    return new Promise((resolve) => {
      let hecho = false;
      const fin = () => { if (!hecho) { hecho = true; resolve(); } };
      u.onend = fin;
      u.onerror = fin;
      // Red de seguridad: si el motor se atasca, no dejamos la promesa colgada.
      // Holgada para que con frases muy cortas («a») no se dé por terminada antes de tiempo.
      setTimeout(fin, 1000 + texto.length * 110);
      if (id !== colaId) return fin();
      try { sintesis.speak(u); } catch (_) { fin(); }
    });
  }

  /* Dice una lista de frases una detrás de otra, con una pausa entre ellas.
     Si mientras tanto se dice otra cosa o se manda callar, la secuencia se
     abandona (para no soltar la segunda frase de una letra que ya no está). */
  async function secuencia(frases, opciones = {}) {
    const { pausa = 120 } = opciones;
    for (let i = 0; i < frases.length; i++) {
      const dicho = hablar(frases[i], { ...opciones, encolar: false });
      const id = colaId;                 // hablar() acaba de reservar este turno
      await dicho;
      if (pausa && i < frases.length - 1) await new Promise((r) => setTimeout(r, pausa));
      if (id !== colaId) return;
    }
  }

  return {
    hablar,
    secuencia,
    callar() { colaId++; if (sintesis) sintesis.cancel(); },
    activar(v) { activa = !!v; if (!activa) this.callar(); },
    get disponible() { return !!sintesis; },
    get tieneVozEspanola() { return !!vozEs; },
    get nombreVoz() { return vozEs ? `${vozEs.name} (${vozEs.lang})` : null; },
  };
})();
