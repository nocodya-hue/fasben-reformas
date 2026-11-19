/* Fasben Reformas · interacción ligera (sin librerías) */
(() => {
  const $ = (s, c = document) => c.querySelector(s), $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.remove('sin-js');

  /* ---------- un solo bucle de scroll (rAF) ---------- */
  const tareas = [];
  let pid = 0;
  const alScroll = () => { if (!pid) pid = requestAnimationFrame(() => { pid = 0; tareas.forEach((t) => t()); }); };
  addEventListener('scroll', alScroll, { passive: true });
  addEventListener('resize', () => { tareas.forEach((t) => t(true)); });

  const cab = $('#cab'), barra = $('.barra'), portada = $('#inicio');
  tareas.push(() => {
    cab.classList.toggle('solida', scrollY > 30);
    if (barra) barra.classList.toggle('ver', scrollY > portada.offsetHeight * 0.7);
  });

  /* ---------- revelado ---------- */
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('visto'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  $$('.revelar').forEach((el, i) => { el.style.setProperty('--r', `${(i % 3) * 0.07}s`); io.observe(el); });

  /* ---------- vídeos: se cargan al acercarse y solo suenan (mudos) mientras se ven ---------- */
  const ioV = new IntersectionObserver((es) => es.forEach((e) => {
    const v = e.target;
    if (e.isIntersecting) {
      if (!v.src && v.dataset.src) { v.src = v.dataset.src; }
      if (!quieto) v.play().catch(() => {});
    } else if (!v.paused) v.pause();
  }), { rootMargin: '200px 0px', threshold: 0.15 });
  $$('video[data-src]').forEach((v) => ioV.observe(v));

  /* ---------- Berbegal: carril horizontal fijado en escritorio ---------- */
  const pista = $('#pista'), fases = $('#fases'), nivel = $('#nivel');
  if (pista && fases) {
    let ancho = 0;
    const medir = () => {
      if (innerWidth <= 900) { pista.style.height = ''; fases.style.transform = ''; return; }
      ancho = Math.max(0, fases.scrollWidth - innerWidth + 48);
      pista.style.height = `${$('.berbegal__marco').offsetHeight + ancho}px`;
    };
    medir(); addEventListener('load', medir);
    tareas.push((resize) => {
      if (resize) medir();
      if (innerWidth <= 900) return;
      const r = pista.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (-r.top + (cab.offsetHeight + 10)) / Math.max(1, ancho)));
      fases.style.transform = `translate3d(${(-p * ancho).toFixed(1)}px,0,0)`;
      nivel.style.width = `${(p * 100).toFixed(1)}%`;
    });
  }

  /* ---------- antes y después ---------- */
  const comp = $('#comparar'), rango = $('#comparar-rango');
  if (comp && rango) {
    const poner = () => comp.style.setProperty('--p', rango.value + '%');
    rango.addEventListener('input', poner); poner();
  }

  /* ---------- la cuerda baja con el scroll ---------- */
  const colg = $('#colgados'), cuerda = $('#cuerda');
  // la cuerda baja desde lo alto de la sección hasta el operario del vídeo (≈ 60 % del ancho, 18 % del alto del clip)
  const clipC = $('.colgados__clip .clip'), caja = $('.cuerda');
  const colocar = () => { const s = colg.getBoundingClientRect(), c = clipC.getBoundingClientRect(); caja.style.setProperty('--cx', `${(c.left - s.left + c.width * 0.6).toFixed(0)}px`); caja.style.setProperty('--ch', `${(c.top - s.top + c.height * 0.18).toFixed(0)}px`); };
  if (colg && cuerda && clipC) { colocar(); addEventListener('load', colocar); tareas.push((resize) => {
    if (resize) colocar();
    const r = colg.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (innerHeight * 0.9 - r.top) / (innerHeight * 0.75)));
    cuerda.style.setProperty('--c', p.toFixed(3));
  }); }

  /* ---------- filtros de obras (en móvil se ven 6 y el botón abre el resto) ---------- */
  const rejilla = $('#rejilla'), mas = $('#obras-mas');
  if (mas) mas.addEventListener('click', () => { rejilla.classList.remove('corta'); $$('#rejilla .obra').forEach((o) => o.classList.add('visto')); });
  $$('.filtro').forEach((b) => b.addEventListener('click', () => {
    rejilla.classList.remove('corta');
    $$('.filtro').forEach((x) => x.setAttribute('aria-pressed', x === b));
    const f = b.dataset.f;
    $$('#rejilla .obra').forEach((o) => { o.hidden = f !== 'todas' && o.dataset.cat !== f; if (!o.hidden) o.classList.add('visto'); });
  }));

  /* ---------- visor de una obra (todas sus fotos) ---------- */
  const visor = $('#visor'), cajaF = $('#visor-fotos');
  const pic = (f, alt) => { const s = (e) => f.a.map((a) => `img/${f.id}-${a}.${e} ${a}w`).join(', '); return `<picture><source type="image/avif" srcset="${s('avif')}" sizes="86vw"><source type="image/webp" srcset="${s('webp')}" sizes="86vw"><img src="img/${f.id}-${f.a.at(-1)}.webp" width="${f.w}" height="${f.h}" alt="${alt}" loading="lazy" decoding="async"></picture>`; };
  $$('.obra__btn').forEach((b) => b.addEventListener('click', () => {
    const o = (window.OBRAS || []).find((x) => x.id === b.dataset.obra); if (!o || !visor) return;
    $('#visor-tit').textContent = o.t; $('#visor-meta').textContent = o.l;
    $('#visor-cita').textContent = o.c ? (/^[«¿¡A-ZÁÉÍÓÚ]/.test(o.c) && o.c.length < 140 && !o.c.includes('. ') ? `«${o.c}»` : o.c) : '';
    $('#visor-reel').href = o.r;
    cajaF.innerHTML = o.f.map((f, i) => pic(f, `${o.t}, foto ${i + 1} de ${o.f.length}`)).join('');
    cajaF.scrollLeft = 0;
    visor.showModal();
  }));
  if (visor) {
    $('#visor-cerrar').addEventListener('click', () => visor.close());
    visor.addEventListener('click', (e) => { if (e.target === visor) visor.close(); });
    visor.addEventListener('close', () => { cajaF.innerHTML = ''; });
  }

  /* ---------- formulario → WhatsApp ---------- */
  const form = $('#formulario');
  if (form) form.addEventListener('submit', (e) => {
    e.preventDefault();
    const d = new FormData(form);
    const t = [`Hola, soy ${d.get('nombre')}.`, `Quiero: ${d.get('que')}.`, d.get('donde') ? `En ${d.get('donde')}.` : '', d.get('msg') || ''].filter(Boolean).join(' ');
    open(`https://wa.me/${window.WA}?text=${encodeURIComponent(t)}`, '_blank', 'noopener');
  });

  alScroll();
})();
