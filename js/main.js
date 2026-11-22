/* ==========================================================================
   main.js — WhatsApp central, navegação, header, scrollspy, lightbox e reveal
   ========================================================================== */
(() => {
  "use strict";

  /* ------------------------------------------------------------------
     Configuração (edite aqui para reaproveitar a demo em outro cliente)
     ------------------------------------------------------------------ */
  const CONFIG = {
    whatsapp: {
      number: "5585900000000", // formato: país + DDD + número (fictício)
      messages: {
        agendar: "Olá! Gostaria de agendar um horário na Barbearia do Geovane.",
        "corte-simples": "Olá! Gostaria de agendar um corte simples (R$ 20).",
        "corte-degrade": "Olá! Gostaria de agendar um corte degradê (R$ 25).",
        barba: "Olá! Gostaria de agendar um corte com barba (+ R$ 5).",
        luzes: "Olá! Gostaria de agendar luzes (R$ 80).",
        contato: "",
      },
    },
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const prefersReducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------
     1. Links do WhatsApp (<a data-wa="chave">)
     ------------------------------------------------------------------ */
  function initWhatsApp() {
    const { number, messages } = CONFIG.whatsapp;
    $$("[data-wa]").forEach((link) => {
      const message = messages[link.dataset.wa];
      link.href = `https://wa.me/${number}` + (message ? `?text=${encodeURIComponent(message)}` : "");
    });
  }

  /* ------------------------------------------------------------------
     2. Navegação: inline quando cabe, popover quando não cabe
     ------------------------------------------------------------------ */
  function initNav() {
    const header = $(".site-header");
    const inner = $(".header-inner");
    const menu = $("#site-menu");
    if (!header || !inner || !menu) return;

    // Sem suporte a popover: mantém o menu inline.
    if (!("popover" in HTMLElement.prototype)) {
      header.classList.add("is-wide");
      menu.removeAttribute("popover");
      return;
    }

    const isOpen = () => {
      try {
        return menu.matches(":popover-open");
      } catch {
        return false;
      }
    };

    let lastWidth = 0;

    const layout = () => {
      const wasOpen = isOpen();

      // Mede a linha com o menu inline
      header.classList.add("is-measuring", "is-wide");
      menu.removeAttribute("popover");
      const fits = inner.scrollWidth <= inner.clientWidth;

      header.classList.toggle("is-wide", fits);
      if (!fits) {
        menu.setAttribute("popover", "auto");
        if (wasOpen) menu.showPopover();
      }
      requestAnimationFrame(() => header.classList.remove("is-measuring"));
    };

    const observer = new ResizeObserver(() => {
      const width = header.clientWidth;
      // Recolhido: só remede se a largura aumentou
      if (header.classList.contains("is-wide") || width > lastWidth) layout();
      lastWidth = width;
    });

    layout();
    lastWidth = header.clientWidth;
    observer.observe(header);
    observer.observe(menu);
    document.fonts?.ready.then(layout);

    // Fecha o menu recolhido ao escolher um link
    menu.addEventListener("click", (event) => {
      if (event.target.closest("a") && menu.hasAttribute("popover")) {
        try {
          menu.hidePopover();
        } catch {
          /* já fechado */
        }
      }
    });
  }

  /* ------------------------------------------------------------------
     3. Header sólido ao rolar + link ativo (scrollspy)
     ------------------------------------------------------------------ */
  function initScrollState() {
    const header = $(".site-header");
    const links = $$('#site-menu a[href^="#"]');
    if (!header) return;

    const linkById = new Map(links.map((link) => [link.getAttribute("href").slice(1), link]));
    const setCurrent = (id) => {
      links.forEach((link) => link.removeAttribute("aria-current"));
      linkById.get(id)?.setAttribute("aria-current", "location");
    };

    const onScroll = () => {
      header.classList.toggle("is-scrolled", window.scrollY > 24);
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      if (atBottom) setCurrent("contato");
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    const sections = [...linkById.keys()].map((id) => document.getElementById(id)).filter(Boolean);
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setCurrent(entry.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    sections.forEach((section) => spy.observe(section));
  }

  /* ------------------------------------------------------------------
     4. Lightbox da galeria (<dialog> nativo)
     ------------------------------------------------------------------ */
  function initLightbox() {
    const dialog = $(".lightbox");
    const image = $(".lightbox-img");
    const items = $$("[data-lightbox]");
    if (!dialog || !image || !items.length || typeof dialog.showModal !== "function") return;

    let index = 0;

    const show = (next) => {
      index = (next + items.length) % items.length;
      const link = items[index];
      image.src = link.getAttribute("href");
      image.alt = $("img", link)?.alt ?? "";
    };

    items.forEach((link, i) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        show(i);
        dialog.showModal();
      });
    });

    dialog.addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight") show(index + 1);
      if (event.key === "ArrowLeft") show(index - 1);
    });

    // Fecha ao clicar fora da imagem (reforço para navegadores sem closedby)
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
  }

  /* ------------------------------------------------------------------
     5. Fallback da animação de entrada (sem scroll-driven animations)
     ------------------------------------------------------------------ */
  function initReveal() {
    const nativeSupport = CSS.supports("(animation-timeline: view()) and (animation-range: entry)");
    if (nativeSupport || prefersReducedMotion) return;

    const items = $$(".reveal");
    items.forEach((el) => el.classList.add("reveal-pending"));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 },
    );
    items.forEach((el) => observer.observe(el));
  }

  initWhatsApp();
  initNav();
  initScrollState();
  initLightbox();
  initReveal();
})();
