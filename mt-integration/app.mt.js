/**
 * Infinite shirt rows: each track gets two identical sequences.
 * translateX(-50%) moves exactly one sequence — loop is seamless.
 * Row 2 uses CSS animation-direction: reverse (same keyframes as row 1 & 3).
 *
 * Images: MakerTown resources (thumbnail-shirt-1..8). No Vercel dependency.
 */
const SHIRT_IMAGES = [
  "https://print-world.jp/resource/b9e0a316c6badf9ec96901a68856161784082469",
  "https://print-world.jp/resource/5d14afa11a608bd3d408b659cd54781784082524",
  "https://print-world.jp/resource/6c5ccc46870a5b496fb078be8393561784082540",
  "https://print-world.jp/resource/33224b4dc07a88bae51cdebf9cf5581784082579",
  "https://print-world.jp/resource/7011c728ad632bc8f121fbeb5e7ce71784082596",
  "https://print-world.jp/resource/788fa8334be7a82d5796e2e38eb8991784082612",
  "https://print-world.jp/resource/8bcb8ae205bc8a23b6b43f339688f41784082627",
  "https://print-world.jp/resource/c95a2c653e0cc4c8121c2de1d662c61784082646",
];

function cardHtml(src) {
  return `<div class="shirt-card"><img src="${src}" alt="" width="160" height="160" decoding="async" /></div>`;
}

function fillTrack(track, images) {
  const set = images.map(cardHtml).join("");
  track.innerHTML = set + set;
}

document.querySelectorAll(".marquee__track").forEach((track) => {
  const row = track.getAttribute("data-row");
  let images = [...SHIRT_IMAGES];
  if (row === "2") {
    images.reverse();
  }
  fillTrack(track, images);
});

// Section2 product cards: clone enough sets and move by the measured width of one set.
// This avoids the visible snap that can happen when CSS guesses the loop distance as -50%.
function setupMeasuredLoop(track, setSelector, translateVariable) {
  const original = track?.querySelector(setSelector);
  if (!track || !original || track.dataset.loopReady) return;

  original.dataset.loopOriginal = "true";
  track.dataset.loopReady = "true";

  const sync = () => {
    track.querySelectorAll(`${setSelector}[data-loop-clone="true"]`).forEach((clone) => clone.remove());

    const setWidth = original.getBoundingClientRect().width;
    const viewportWidth = track.parentElement?.getBoundingClientRect().width || window.innerWidth;

    if (!setWidth) return;

    const totalCopies = Math.max(2, Math.ceil((viewportWidth + setWidth) / setWidth) + 1);

    for (let i = 1; i < totalCopies; i += 1) {
      const clone = original.cloneNode(true);
      delete clone.dataset.loopOriginal;
      clone.dataset.loopClone = "true";
      clone.setAttribute("aria-hidden", "true");
      track.appendChild(clone);
    }

    track.style.setProperty(translateVariable, `${-setWidth}px`);
  };

  requestAnimationFrame(sync);

  if ("ResizeObserver" in window) {
    const observer = new ResizeObserver(sync);
    observer.observe(original);
    if (track.parentElement) observer.observe(track.parentElement);
  } else {
    window.addEventListener("resize", sync);
  }
}

setupMeasuredLoop(
  document.querySelector(".sec2-products-track"),
  ".sec2-products",
  "--sec2-loop-translate"
);

setupMeasuredLoop(
  document.querySelector(".sec7-track"),
  ".sec7-grid",
  "--sec7-loop-translate"
);

// Product list: ranking slider arrows
(() => {
  const slider = document.querySelector("[data-plp-slider]");
  if (!slider) return;

  const viewport = slider.querySelector(".plp-ranking__viewport");
  const prev = slider.querySelector(".plp-ranking__nav--prev");
  const next = slider.querySelector(".plp-ranking__nav--next");
  if (!viewport || !prev || !next) return;

  const scrollStep = () => {
    const card = viewport.querySelector(".product-card");
    if (!card) return Math.max(240, viewport.clientWidth * 0.85);
    const trackStyles = window.getComputedStyle(viewport.querySelector(".plp-ranking__track"));
    const gap = parseFloat(trackStyles.columnGap || trackStyles.gap || "18") || 18;
    return card.getBoundingClientRect().width + gap;
  };

  prev.addEventListener("click", () => {
    viewport.scrollBy({ left: -scrollStep(), behavior: "smooth" });
  });

  next.addEventListener("click", () => {
    viewport.scrollBy({ left: scrollStep(), behavior: "smooth" });
  });
})();

// Product detail: gallery thumb switching
(() => {
  const gallery = document.querySelector("[data-pdp-gallery]");
  if (!gallery) return;

  const mainImg = gallery.querySelector(".pdp-gallery__main-img");
  const thumbs = Array.from(gallery.querySelectorAll(".pdp-gallery__thumb"));
  const prevBtn = gallery.querySelector(".pdp-gallery__nav--prev");
  const nextBtn = gallery.querySelector(".pdp-gallery__nav--next");
  if (!mainImg || thumbs.length === 0) return;

  let activeIndex = Math.max(
    0,
    thumbs.findIndex((thumb) => thumb.classList.contains("is-active"))
  );

  const showThumb = (index) => {
    const thumb = thumbs[index];
    const src = thumb.getAttribute("data-pdp-src");
    if (!src) return;
    mainImg.src = src;
    thumbs.forEach((t) => t.classList.remove("is-active"));
    thumb.classList.add("is-active");
    activeIndex = index;
  };

  thumbs.forEach((thumb, index) => {
    thumb.addEventListener("click", () => showThumb(index));
  });

  prevBtn?.addEventListener("click", () => {
    showThumb((activeIndex - 1 + thumbs.length) % thumbs.length);
  });

  nextBtn?.addEventListener("click", () => {
    showThumb((activeIndex + 1) % thumbs.length);
  });
})();

// Section4 cards: duplicate one full set for continuous left loop.
const sec4Track = document.querySelector(".sec4-track");
const sec4Set = sec4Track?.querySelector(".sec4-list");

if (sec4Track && sec4Set && !sec4Track.dataset.loopReady) {
  sec4Track.appendChild(sec4Set.cloneNode(true));
  sec4Track.dataset.loopReady = "true";
}

// --- Global hamburger menu (all pages) ---
(() => {
  const menuBtn = document.querySelector(".menu-btn");
  if (!menuBtn) return;

  const MENU_ID = "site-menu";
  const menu = document.createElement("aside");
  menu.id = MENU_ID;
  menu.className = "site-menu";
  menu.setAttribute("aria-label", "サイトメニュー");
  menu.setAttribute("aria-hidden", "true");
  menu.innerHTML = `
    <div class="site-menu__overlay" data-menu-close></div>
    <div class="site-menu__panel" role="dialog" aria-modal="true" aria-label="メニュー">
      <div class="site-menu__head">
        <button type="button" class="site-menu__close" aria-label="メニューを閉じる" data-menu-close></button>
      </div>
      <nav class="site-menu__nav" aria-label="サイト内リンク">
        <a class="site-menu__link" href="index.html">トップ</a>
        <a class="site-menu__link" href="product-list.html">オリジナル Tシャツ</a>
        <a class="site-menu__link" href="product-detail.html">商品詳細（サンプル）</a>
        <a class="site-menu__link" href="guide-flow.html">ご注文から到着までの流れ</a>
        <a class="site-menu__link" href="guide-design-tool.html">デザインツールの使い方</a>
        <a class="site-menu__link" href="guide-data-submission.html">データ入稿ガイド</a>
        <a class="site-menu__link" href="guide-print-method.html">プリント方法について</a>
      </nav>
      <div class="site-menu__actions" aria-label="お問い合わせ">
        <a class="site-menu__action site-menu__action--phone" href="tel:0566785885">電話する</a>
        <a class="site-menu__action site-menu__action--mail" href="#">お問い合わせ</a>
        <a class="site-menu__action site-menu__action--line" href="#" rel="noopener">LINE相談</a>
      </div>
    </div>
  `;
  document.body.appendChild(menu);

  menuBtn.setAttribute("aria-controls", MENU_ID);
  menuBtn.setAttribute("aria-expanded", "false");

  let lastFocused = null;
  const focusablesSelector =
    'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function setOpen(isOpen) {
    document.documentElement.classList.toggle("is-menu-open", isOpen);
    menu.setAttribute("aria-hidden", String(!isOpen));
    menuBtn.setAttribute("aria-expanded", String(isOpen));

    if (isOpen) {
      lastFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const closeBtn = menu.querySelector(".site-menu__close");
      closeBtn?.focus();
    } else {
      if (lastFocused) lastFocused.focus();
    }
  }

  function isOpen() {
    return document.documentElement.classList.contains("is-menu-open");
  }

  menuBtn.addEventListener("click", () => setOpen(!isOpen()));

  menu.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.closest("[data-menu-close]")) setOpen(false);
    if (target.matches(".site-menu__link")) setOpen(false);
  });

  document.addEventListener("keydown", (e) => {
    if (!isOpen()) return;
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      return;
    }
    if (e.key !== "Tab") return;

    const panel = menu.querySelector(".site-menu__panel");
    const focusables = panel ? Array.from(panel.querySelectorAll(focusablesSelector)) : [];
    if (focusables.length === 0) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;

    if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  });
})();

// --- Guide subpages: tap image to zoom + pinch / pan (≤768px) ---
(() => {
  const onFlowPage = document.body.classList.contains("guide-flow-page");
  const onDesignToolPage = document.body.classList.contains("guide-design-tool-page");
  const onDataSubmissionPage = document.body.classList.contains("guide-data-submission-page");
  const onPrintMethodPage = document.body.classList.contains("guide-print-method-page");
  if (!onFlowPage && !onDesignToolPage && !onDataSubmissionPage && !onPrintMethodPage) return;

  const mq = window.matchMedia("(max-width: 768px)");
  let overlay = null;
  let resetZoomView = () => {};

  function touchDistance(a, b) {
    const dx = a.clientX - b.clientX;
    const dy = a.clientY - b.clientY;
    return Math.hypot(dx, dy);
  }

  function ensureOverlay() {
    if (overlay) return overlay;
    overlay = document.createElement("div");
    overlay.className = "guide-flow-zoom";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "拡大表示（ピンチで拡大、ダブルタップで切替）");
    overlay.innerHTML = `
      <button type="button" class="guide-flow-zoom__close" aria-label="閉じる">×</button>
      <div class="guide-flow-zoom__viewport">
        <div class="guide-flow-zoom__pinch">
          <img src="" alt="" decoding="async" draggable="false" />
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const viewport = overlay.querySelector(".guide-flow-zoom__viewport");
    const pinch = overlay.querySelector(".guide-flow-zoom__pinch");
    const img = overlay.querySelector("img");
    const closeBtn = overlay.querySelector(".guide-flow-zoom__close");

    let scale = 1;
    let tx = 0;
    let ty = 0;

    function applyTransform() {
      if (!pinch) return;
      pinch.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    }

    function resetView() {
      scale = 1;
      tx = 0;
      ty = 0;
      applyTransform();
    }

    resetZoomView = resetView;

    let pinchStartDist = 0;
    let pinchStartScale = 1;
    let pinchActive = false;

    let panning = false;
    let panOriginX = 0;
    let panOriginY = 0;
    let panStartTx = 0;
    let panStartTy = 0;

    let lastTapTime = 0;
    let panMoved = false;

    function close() {
      overlay.classList.remove("is-open");
      document.documentElement.classList.remove("is-guide-flow-zoom-open");
      resetView();
      if (img) {
        img.removeAttribute("src");
        img.alt = "";
      }
    }

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });
    closeBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      close();
    });
    viewport?.addEventListener("click", (e) => e.stopPropagation());

    viewport?.addEventListener(
      "touchstart",
      (e) => {
        if (e.touches.length === 2) {
          lastTapTime = 0;
          pinchActive = true;
          panning = false;
          pinchStartDist = touchDistance(e.touches[0], e.touches[1]);
          pinchStartScale = scale;
        } else if (e.touches.length === 1 && scale > 1) {
          panning = true;
          pinchActive = false;
          panMoved = false;
          panOriginX = e.touches[0].clientX;
          panOriginY = e.touches[0].clientY;
          panStartTx = tx;
          panStartTy = ty;
        }
      },
      { passive: true }
    );

    viewport?.addEventListener(
      "touchmove",
      (e) => {
        if (e.touches.length === 2) {
          e.preventDefault();
          const d = touchDistance(e.touches[0], e.touches[1]);
          if (pinchStartDist > 0) {
            let next = pinchStartScale * (d / pinchStartDist);
            next = Math.min(4, Math.max(1, next));
            scale = next;
            applyTransform();
          }
        } else if (e.touches.length === 1 && panning && scale > 1) {
          e.preventDefault();
          const t = e.touches[0];
          const mx = Math.abs(t.clientX - panOriginX);
          const my = Math.abs(t.clientY - panOriginY);
          if (mx > 12 || my > 12) panMoved = true;
          tx = panStartTx + (t.clientX - panOriginX);
          ty = panStartTy + (t.clientY - panOriginY);
          applyTransform();
        }
      },
      { passive: false }
    );

    viewport?.addEventListener("touchend", (e) => {
      if (e.touches.length === 0) {
        pinchActive = false;
        panning = false;
        pinchStartDist = 0;

        if (e.changedTouches.length === 1) {
          if (panMoved) {
            lastTapTime = 0;
            panMoved = false;
          } else {
            const now = Date.now();
            if (now - lastTapTime < 280) {
              if (scale > 1.25) {
                scale = 1;
                tx = 0;
                ty = 0;
              } else {
                scale = 2.5;
              }
              applyTransform();
              lastTapTime = 0;
            } else {
              lastTapTime = now;
            }
          }
        }
      } else if (e.touches.length === 1) {
        pinchActive = false;
        pinchStartDist = 0;
      }
    });

    viewport?.addEventListener(
      "wheel",
      (e) => {
        if (!overlay.classList.contains("is-open")) return;
        if (!e.ctrlKey) return;
        e.preventDefault();
        const delta = e.deltaY < 0 ? 1.08 : 0.92;
        scale = Math.min(4, Math.max(1, scale * delta));
        if (scale === 1) {
          tx = 0;
          ty = 0;
        }
        applyTransform();
      },
      { passive: false }
    );

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && overlay.classList.contains("is-open")) {
        e.preventDefault();
        close();
      }
    });

    return overlay;
  }

  function openZoom(src, alt) {
    const el = ensureOverlay();
    resetZoomView();
    const img = el.querySelector(".guide-flow-zoom__pinch img");
    if (!img) return;
    img.src = src;
    img.alt = alt || "";
    el.classList.add("is-open");
    document.documentElement.classList.add("is-guide-flow-zoom-open");
  }

  function isZoomableFlowImg(el) {
    if (!(el instanceof HTMLImageElement)) return false;
    if (el.classList.contains("guide-design-flow__media-img")) return true;
    if (el.closest(".guide-design-flow__card-inner")) return true;
    if (el.closest(".guide-template-flow__card-inner")) return true;
    if (el.closest(".guide-post-submission-flow__card-inner")) return true;
    return false;
  }

  function isTitleOrChromeImg(el) {
    if (!(el instanceof HTMLImageElement)) return true;
    if (el.closest(".fv-header")) return true;
    if (el.classList.contains("guide-hero__kicker")) return true;
    if (el.closest(".guide-hero__title-img-wrap")) return true;
    if (el.classList.contains("design-simulator__title-img")) return true;
    if (el.classList.contains("text-guide__title-img")) return true;
    if (el.classList.contains("transform-guide__title-img")) return true;
    if (el.classList.contains("image-guide__title-img")) return true;
    if (el.classList.contains("stamp-guide__title-img")) return true;
    if (el.classList.contains("save-guide__title-img")) return true;
    if (el.classList.contains("design-simulator__head-icon")) return true;
    return false;
  }

  function isZoomableDesignToolImg(el) {
    if (!(el instanceof HTMLImageElement)) return false;
    if (isTitleOrChromeImg(el)) return false;
    if (el.closest(".design-simulator__screen")) return true;
    if (el.classList.contains("text-guide__media-img")) return true;
    if (el.classList.contains("transform-guide__media-img")) return true;
    if (el.classList.contains("image-guide__media-img")) return true;
    if (el.classList.contains("image-guide__file-type-img")) return true;
    if (el.classList.contains("stamp-guide__media-img")) return true;
    if (el.classList.contains("save-guide__media-img")) return true;
    return false;
  }

  function bindMain(mainSelector, testFn) {
    document.querySelector(mainSelector)?.addEventListener("click", (e) => {
      const t = e.target;
      if (!testFn(t)) return;
      if (!mq.matches) return;
      e.preventDefault();
      const img = t;
      openZoom(img.currentSrc || img.src, img.alt);
    });
  }

  function isZoomableDataSubmissionImg(el) {
    if (!(el instanceof HTMLImageElement)) return false;
    if (el.closest(".fv-header")) return false;
    if (el.classList.contains("guide-hero__kicker")) return false;
    if (el.closest(".guide-hero__title-img-wrap")) return false;
    if (el.classList.contains("data-submission-guide__file-type-img")) return true;
    if (el.classList.contains("data-submission-spec__title-img")) return true;
    if (el.classList.contains("data-submission-print-method__title-img")) return true;
    return false;
  }

  function isZoomablePrintMethodImg(el) {
    if (!(el instanceof HTMLImageElement)) return false;
    if (el.closest(".fv-header")) return false;
    if (el.classList.contains("guide-hero__kicker")) return false;
    if (el.closest(".guide-hero__title-img-wrap")) return false;
    if (el.closest(".print-method-feature__icon")) return true;
    if (el.classList.contains("data-submission-caution__media-img")) return true;
    if (el.classList.contains("print-method-finish__media-img")) return true;
    return false;
  }

  if (onFlowPage) bindMain(".guide-flow-main", isZoomableFlowImg);
  if (onDesignToolPage) bindMain(".guide-design-tool-main", isZoomableDesignToolImg);
  if (onDataSubmissionPage) bindMain(".guide-data-submission-main", isZoomableDataSubmissionImg);
  if (onPrintMethodPage) bindMain(".guide-print-method-main", isZoomablePrintMethodImg);
})();

/**
 * In-page anchor scrolling: eased duration, header offset, reduced-motion fallback.
 * CSS `scroll-behavior: smooth` on html remains a fallback for native hash navigation.
 */
(function initSmoothInPageScroll() {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function getHeaderOffset() {
    const header = document.querySelector(".fv-header");
    if (!header) return 0;
    const position = getComputedStyle(header).position;
    if (position !== "fixed" && position !== "sticky") return 0;
    return header.getBoundingClientRect().height;
  }

  function getScrollTop(target) {
    const gap = 12;
    const margin = Number.parseInt(target.getAttribute("data-scroll-margin") || "0", 10) || 0;
    return Math.max(0, window.scrollY + target.getBoundingClientRect().top - getHeaderOffset() - gap - margin);
  }

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
  }

  function scrollToY(targetY) {
    if (reducedMotion.matches) {
      window.scrollTo(0, targetY);
      return;
    }

    const startY = window.scrollY;
    const distance = targetY - startY;
    if (Math.abs(distance) < 2) return;

    const duration = Math.min(900, Math.max(350, Math.abs(distance) * 0.45));
    const startTime = performance.now();

    function frame(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      window.scrollTo(0, startY + distance * easeInOutCubic(progress));
      if (progress < 1) requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  }

  function scrollToElement(target, updateHash) {
    scrollToY(getScrollTop(target));
    if (!updateHash || !target.id) return;
    const hash = `#${encodeURIComponent(target.id)}`;
    if (history.replaceState) {
      history.replaceState(null, "", hash);
    } else {
      location.hash = target.id;
    }
  }

  function resolveHashTarget(hash) {
    if (!hash || hash === "#") return null;
    try {
      return document.getElementById(decodeURIComponent(hash.slice(1)));
    } catch {
      return null;
    }
  }

  function isSamePageAnchor(anchor) {
    const url = new URL(anchor.href, location.href);
    return url.origin === location.origin && url.pathname === location.pathname;
  }

  document.addEventListener("click", (event) => {
    const anchor = event.target.closest('a[href^="#"]');
    if (!anchor || anchor.target === "_blank" || event.defaultPrevented) return;

    const href = anchor.getAttribute("href");
    if (!href || href === "#" || !isSamePageAnchor(anchor)) return;

    const target = resolveHashTarget(href);
    if (!target) return;

    event.preventDefault();
    scrollToElement(target, true);
  });

  function scrollToHashOnLoad() {
    const target = resolveHashTarget(location.hash);
    if (!target) return;
    requestAnimationFrame(() => {
      scrollToElement(target, false);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scrollToHashOnLoad);
  } else {
    scrollToHashOnLoad();
  }
})();

// ---------------------------------------------------------------------------
// Product list: fill the static .plp-grid with REAL MakerTown products.
// Data source = MT's structured "商品グリッド" block rendered on the same page
// (.mcPage__itemListContent-grid, kept display:none via styles.css). We read its
// items and rebuild them as our .plp-card markup inside .plp-grid, so the entire
// Vercel static PLP stays unchanged and only the grid becomes dynamic. No API.
// MT exposes: link (/item/{id}), image, name, price. Per-product tags are not
// available from the block, so the generated cards omit the tag list.
// ---------------------------------------------------------------------------
(() => {
  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[ch]));
  }

  function buildCard(item) {
    const href = item.getAttribute("href") || "#";
    const img = item.querySelector(".itemListContent__image");
    const src = img ? img.getAttribute("src") || "" : "";
    const alt = img ? img.getAttribute("alt") || "" : "";
    const name = (item.querySelector(".itemListContent__name")?.textContent || "").trim();
    const price = (item.querySelector(".itemListContent__price")?.textContent || "").trim();
    return (
      '<article class="plp-card">' +
        '<a class="plp-card__link" href="' + esc(href) + '">' +
          '<div class="plp-card__image"><img src="' + esc(src) + '" alt="' + esc(alt) + '" width="200" height="200" loading="lazy" /></div>' +
          '<p class="plp-card__chip">Tシャツ</p>' +
          '<h2 class="plp-card__name">' + esc(name) + "</h2>" +
          '<p class="plp-card__price">' + esc(price) + "</p>" +
        "</a>" +
      "</article>"
    );
  }

  function populatePlpGrid() {
    const grid = document.querySelector(".plp-grid");
    if (!grid) return;
    const source = document.querySelector(".mcPage__itemListContent-grid .itemListContent__gridArea");
    if (!source) return;
    const items = source.querySelectorAll(".itemListContent__grid");
    if (!items.length) return;

    grid.innerHTML = Array.from(items).map(buildCard).join("");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", populatePlpGrid);
  } else {
    populatePlpGrid();
  }
})();
