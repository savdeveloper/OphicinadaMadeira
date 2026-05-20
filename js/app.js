/* Ophicina da Madeira — interações simples
   - Menu hambúrguer no mobile
   - Lightbox para galerias (fotos com classe .com-lightbox)
*/
(function () {
  // ===== Menu mobile =====
  var btn = document.querySelector(".menu-toggle");
  var nav = document.querySelector(".nav");
  if (btn && nav) {
    btn.addEventListener("click", function () {
      var aberto = nav.classList.toggle("aberto");
      btn.setAttribute("aria-expanded", aberto ? "true" : "false");
    });
  }

  // ===== Ano dinâmico no rodapé =====
  var ano = document.querySelector("[data-ano]");
  if (ano) ano.textContent = new Date().getFullYear();

  // ===== Lightbox =====
  var alvo = document.querySelectorAll("a.com-lightbox");
  if (!alvo.length) return;

  // monta DOM do lightbox
  var lb = document.createElement("div");
  lb.className = "lightbox";
  lb.setAttribute("role", "dialog");
  lb.setAttribute("aria-modal", "true");
  lb.setAttribute("aria-label", "Visualizador de imagem");
  lb.innerHTML =
    '<button class="lightbox__btn lightbox__fechar" aria-label="Fechar">&times;</button>' +
    '<button class="lightbox__btn lightbox__prev" aria-label="Anterior">&#10094;</button>' +
    '<img alt="" />' +
    '<button class="lightbox__btn lightbox__prox" aria-label="Próxima">&#10095;</button>' +
    '<div class="lightbox__contador"></div>';
  document.body.appendChild(lb);

  var imgEl = lb.querySelector("img");
  var contador = lb.querySelector(".lightbox__contador");
  var idx = 0;
  var lista = Array.prototype.slice.call(alvo);

  function abrir(i) {
    idx = (i + lista.length) % lista.length;
    var href = lista[idx].getAttribute("data-full") || lista[idx].href;
    imgEl.src = href;
    imgEl.alt = lista[idx].getAttribute("data-titulo") || "Foto da Ophicina da Madeira";
    contador.textContent = (idx + 1) + " / " + lista.length;
    lb.classList.add("aberto");
    document.body.style.overflow = "hidden";
  }
  function fechar() {
    lb.classList.remove("aberto");
    imgEl.src = "";
    document.body.style.overflow = "";
  }

  lista.forEach(function (a, i) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      abrir(i);
    });
  });

  lb.querySelector(".lightbox__fechar").addEventListener("click", fechar);
  lb.querySelector(".lightbox__prev").addEventListener("click", function () { abrir(idx - 1); });
  lb.querySelector(".lightbox__prox").addEventListener("click", function () { abrir(idx + 1); });
  lb.addEventListener("click", function (e) { if (e.target === lb) fechar(); });

  document.addEventListener("keydown", function (e) {
    if (!lb.classList.contains("aberto")) return;
    if (e.key === "Escape") fechar();
    else if (e.key === "ArrowRight") abrir(idx + 1);
    else if (e.key === "ArrowLeft") abrir(idx - 1);
  });

  // gestos touch básicos
  var startX = null;
  lb.addEventListener("touchstart", function (e) { startX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", function (e) {
    if (startX === null) return;
    var dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) abrir(idx + (dx < 0 ? 1 : -1));
    startX = null;
  });
})();
