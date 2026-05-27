/* =====================================================================
   Ophicina da Madeira — interações
   - Menu mobile a11y completo
   - Lightbox acessível (focus trap, restore focus, aria-live, loading state)
   - Scroll reveal sutil
   - Header com glass ao scrollar
   - WhatsApp flutuante esconde no scroll down
   - Theme toggle (claro/noturno) com localStorage
   - Mapa do Google: facade pattern (carrega só no clique)
   ===================================================================== */
(() => {
  'use strict';

  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ════════ Ano dinâmico ════════
  const ano = $('[data-ano]');
  if (ano) {
    const atual = new Date().getFullYear();
    ano.textContent = String(atual);
    if (ano.tagName === 'TIME') ano.setAttribute('datetime', String(atual));
  }

  // ════════ Theme toggle (claro / noturno) ════════
  const STORAGE_KEY = 'ophicina-tema';
  const aplicaTema = (tema) => {
    document.documentElement.setAttribute('data-tema', tema);
    try { localStorage.setItem(STORAGE_KEY, tema); } catch (_) {}
  };
  // Inicializa (caso o pré-script no <head> não tenha rodado)
  try {
    const salvo = localStorage.getItem(STORAGE_KEY);
    if (salvo === 'claro' || salvo === 'noturno') {
      document.documentElement.setAttribute('data-tema', salvo);
    }
  } catch (_) {}
  $$('[data-tema-toggle]').forEach(btn => {
    btn.addEventListener('click', () => {
      const atual = document.documentElement.getAttribute('data-tema');
      const sistema = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'noturno' : 'claro';
      const base = atual || sistema;
      aplicaTema(base === 'noturno' ? 'claro' : 'noturno');
    });
  });

  // ════════ Header glass on scroll ════════
  const header = $('.cabecalho');
  if (header) {
    const onScroll = () => {
      header.classList.toggle('scrolled', window.scrollY > 24);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ════════ Menu mobile ════════
  const btnMenu = $('.menu-toggle');
  const nav = $('.nav');
  if (btnMenu && nav) {
    const mqMobile = window.matchMedia('(max-width: 900px)');
    const setNavState = (aberto) => {
      nav.classList.toggle('aberto', aberto);
      btnMenu.setAttribute('aria-expanded', aberto ? 'true' : 'false');
      if (mqMobile.matches) {
        nav.toggleAttribute('inert', !aberto);
      } else {
        nav.removeAttribute('inert');
      }
    };
    btnMenu.addEventListener('click', () => {
      const aberto = !nav.classList.contains('aberto');
      setNavState(aberto);
    });
    // Fecha ao mudar viewport
    mqMobile.addEventListener('change', () => setNavState(false));
    // Fecha ao clicar num link
    $$('.nav__lista a').forEach(a => {
      a.addEventListener('click', () => {
        if (mqMobile.matches) setNavState(false);
      });
    });
    // Fecha ao Esc
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && nav.classList.contains('aberto')) setNavState(false);
    });
  }

  // ════════ WhatsApp flutuante: esconde no scroll down ════════
  const wpp = $('.wpp-flutuante');
  if (wpp) {
    let lastY = window.scrollY;
    let ticking = false;
    const onWppScroll = () => {
      const y = window.scrollY;
      if (!ticking) {
        window.requestAnimationFrame(() => {
          wpp.classList.toggle('escondido', y > lastY && y > 320);
          lastY = y;
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', onWppScroll, { passive: true });
  }

  // ════════ Scroll reveal (IntersectionObserver) ════════
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const elementosReveal = $$('.reveal');
    if (elementosReveal.length) {
      const io = new IntersectionObserver((entradas, observer) => {
        entradas.forEach((e, i) => {
          if (e.isIntersecting) {
            e.target.classList.add('visivel');
            observer.unobserve(e.target);
          }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
      elementosReveal.forEach(el => io.observe(el));
    }
  } else {
    $$('.reveal').forEach(el => el.classList.add('visivel'));
  }

  // ════════ Mapa do Google: facade (carrega só no clique) ════════
  $$('[data-mapa-facade]').forEach(facade => {
    const btn = facade.querySelector('button');
    if (!btn) return;
    const carregar = () => {
      const src = facade.dataset.mapaFacade;
      const titulo = facade.dataset.mapaTitulo || 'Mapa';
      const iframe = document.createElement('iframe');
      iframe.src = src;
      iframe.title = titulo;
      iframe.loading = 'lazy';
      iframe.referrerPolicy = 'no-referrer';
      iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups');
      iframe.style.cssText = 'width:100%;height:100%;border:0';
      facade.replaceChildren(iframe);
    };
    btn.addEventListener('click', carregar);
  });

  // ════════ Lightbox (acessível) ════════
  const alvos = $$('a.com-lightbox');
  if (!alvos.length) return;

  const lb = document.createElement('div');
  lb.className = 'lightbox';
  lb.setAttribute('role', 'dialog');
  lb.setAttribute('aria-modal', 'true');
  lb.setAttribute('aria-label', 'Visualizador de imagem');
  lb.setAttribute('hidden', '');
  lb.innerHTML = `
    <button type="button" class="lightbox__btn lightbox__fechar" aria-label="Fechar (Esc)">&times;</button>
    <button type="button" class="lightbox__btn lightbox__prev" aria-label="Imagem anterior (seta esquerda)">&#10094;</button>
    <img alt="" />
    <button type="button" class="lightbox__btn lightbox__prox" aria-label="Próxima imagem (seta direita)">&#10095;</button>
    <div class="lightbox__contador" aria-live="polite" aria-atomic="true"></div>
  `;
  document.body.appendChild(lb);

  const imgEl     = lb.querySelector('img');
  const contador  = lb.querySelector('.lightbox__contador');
  const btnFechar = lb.querySelector('.lightbox__fechar');
  const btnPrev   = lb.querySelector('.lightbox__prev');
  const btnProx   = lb.querySelector('.lightbox__prox');
  let idx = 0;
  let trigger = null;

  const focaveis = () => [btnFechar, btnPrev, btnProx];

  const abrir = (i, elTrigger) => {
    idx = (i + alvos.length) % alvos.length;
    const link = alvos[idx];
    const href = link.dataset.full || link.href;

    imgEl.classList.add('carregando');
    imgEl.onload  = () => imgEl.classList.remove('carregando');
    imgEl.onerror = () => imgEl.classList.remove('carregando');
    imgEl.src = href;
    imgEl.alt = link.dataset.titulo || `Foto ${idx + 1} de ${alvos.length} — Ophicina da Madeira`;
    contador.textContent = `${idx + 1} de ${alvos.length}`;

    if (elTrigger) trigger = elTrigger;
    lb.removeAttribute('hidden');
    // garante reflow antes de animar opacity
    void lb.offsetHeight;
    lb.classList.add('aberto');
    document.body.style.overflow = 'hidden';
    btnFechar.focus();
  };

  const fechar = () => {
    lb.classList.remove('aberto');
    setTimeout(() => {
      lb.setAttribute('hidden', '');
      imgEl.removeAttribute('src');
    }, 240);
    document.body.style.overflow = '';
    if (trigger) {
      trigger.focus({ preventScroll: false });
      trigger = null;
    }
  };

  alvos.forEach((a, i) => {
    a.addEventListener('click', e => {
      e.preventDefault();
      abrir(i, a);
    });
  });

  btnFechar.addEventListener('click', fechar);
  btnPrev.addEventListener('click', () => abrir(idx - 1));
  btnProx.addEventListener('click', () => abrir(idx + 1));
  lb.addEventListener('click', e => { if (e.target === lb) fechar(); });

  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('aberto')) return;
    if (e.key === 'Escape')          { e.preventDefault(); fechar(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); abrir(idx + 1); }
    else if (e.key === 'ArrowLeft')  { e.preventDefault(); abrir(idx - 1); }
    else if (e.key === 'Tab') {
      // focus trap
      const f = focaveis();
      const ativo = document.activeElement;
      const ultimo = f.length - 1;
      const cur = f.indexOf(ativo);
      if (e.shiftKey && cur <= 0)        { e.preventDefault(); f[ultimo].focus(); }
      else if (!e.shiftKey && cur === ultimo) { e.preventDefault(); f[0].focus(); }
      else if (cur < 0)                  { e.preventDefault(); f[0].focus(); }
    }
  });

  // Touch swipe (mobile)
  let startX = null;
  lb.addEventListener('touchstart', e => {
    if (!lb.classList.contains('aberto')) return;
    startX = e.touches[0].clientX;
  }, { passive: true });
  lb.addEventListener('touchend', e => {
    if (startX === null || !lb.classList.contains('aberto')) { startX = null; return; }
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 60) abrir(idx + (dx < 0 ? 1 : -1));
    startX = null;
  });
})();
