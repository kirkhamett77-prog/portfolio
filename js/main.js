(() => {
  const modal = document.getElementById("work-modal");
  if (!modal) return;

  const mediaEl = modal.querySelector(".work-modal-media");
  const imageEl = document.getElementById("work-modal-image");
  const titleEl = document.getElementById("work-modal-title");
  const catEl = document.getElementById("work-modal-cat");
  const descEl = document.getElementById("work-modal-desc");
  const toolsEl = document.getElementById("work-modal-tools");
  const periodEl = document.getElementById("work-modal-period");
  const roleEl = document.getElementById("work-modal-role");
  const upgradeEl = document.getElementById("work-modal-upgrade");
  const linkRow = document.getElementById("work-modal-link-row");
  const linksEl = document.getElementById("work-modal-links");
  const currentEl = document.getElementById("work-slider-current");
  const totalEl = document.getElementById("work-slider-total");
  const prevBtn = modal.querySelector("[data-slider-prev]");
  const nextBtn = modal.querySelector("[data-slider-next]");
  const items = document.querySelectorAll(".work-item");

  let lastFocus = null;
  let slideImages = [];
  let slideIndex = 0;

  function parseImages(item) {
    const raw = item.dataset.images || item.dataset.image || "";
    return raw
      .split(",")
      .map((src) => src.trim())
      .filter(Boolean);
  }

  function setNoImg(el, on) {
    el.classList.toggle("is-no-img", on);
  }

  function updateSliderUi() {
    const total = slideImages.length;
    const hasMany = total > 1;

    currentEl.textContent = total ? String(slideIndex + 1) : "0";
    totalEl.textContent = String(total);
    mediaEl.classList.toggle("has-slider", hasMany);
    prevBtn.disabled = !hasMany;
    nextBtn.disabled = !hasMany;
  }

  function showSlide(index) {
    if (!slideImages.length) {
      imageEl.removeAttribute("src");
      imageEl.alt = "";
      setNoImg(mediaEl, true);
      updateSliderUi();
      return;
    }

    slideIndex = (index + slideImages.length) % slideImages.length;
    const src = slideImages[slideIndex];
    const title = titleEl.textContent || "프로젝트";

    setNoImg(mediaEl, false);
    imageEl.alt = `${title} 이미지 ${slideIndex + 1}`;
    imageEl.onerror = () => {
      imageEl.removeAttribute("src");
      setNoImg(mediaEl, true);
    };
    imageEl.onload = () => {
      setNoImg(mediaEl, false);
    };
    imageEl.src = src;
    updateSliderUi();
  }

  function setupSlider(images) {
    slideImages = images;
    slideIndex = 0;
    showSlide(0);
  }

  items.forEach((item) => {
    const title = item.dataset.title || "";
    const category = item.dataset.category || "";
    const titleNode = item.querySelector(".work-title");
    const catNode = item.querySelector(".work-cat");

    if (titleNode) titleNode.textContent = title;
    if (catNode) catNode.textContent = category;
  });

  function setRelatedLink(item) {
    if (!linkRow || !linksEl) return;

    const links = [
      {
        href: (item?.dataset?.link || "").trim(),
        label: (item?.dataset?.linkText || "").trim(),
      },
      {
        href: (item?.dataset?.eventLink || "").trim(),
        label: (item?.dataset?.eventLinkText || "").trim(),
      },
    ].filter((link) => link.href);

    linksEl.innerHTML = "";

    if (!links.length) {
      linkRow.hidden = true;
      return;
    }

    links.forEach((link) => {
      const a = document.createElement("a");
      a.className = "work-modal-link";
      a.href = link.href;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = link.label || link.href;
      linksEl.appendChild(a);
    });

    linkRow.hidden = false;
  }

  function openModal(item, trigger) {
    lastFocus = trigger;
    titleEl.textContent = item.dataset.title || "";
    catEl.textContent = item.dataset.category || "";
    descEl.textContent = item.dataset.desc || "";
    toolsEl.textContent = item.dataset.tools || "-";
    periodEl.textContent = item.dataset.period || "-";
    roleEl.textContent = item.dataset.role || "-";
    upgradeEl.textContent = item.dataset.upgrade || "-";
    setRelatedLink(item);

    setupSlider(parseImages(item));

    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-modal-open");
    void modal.offsetWidth;
    modal.classList.add("is-open");
    modal.querySelector(".work-modal-close")?.focus();
  }

  function closeModal() {
    if (modal.hidden || !modal.classList.contains("is-open")) return;

    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-modal-open");

    let settled = false;
    const settle = () => {
      if (settled) return;
      settled = true;
      modal.hidden = true;
      imageEl.removeAttribute("src");
      imageEl.onerror = null;
      imageEl.onload = null;
      setNoImg(mediaEl, false);
      mediaEl.classList.remove("has-slider");
      slideImages = [];
      slideIndex = 0;
      descEl.textContent = "";
      toolsEl.textContent = "";
      periodEl.textContent = "";
      roleEl.textContent = "";
      upgradeEl.textContent = "";
      setRelatedLink({});
      lastFocus?.focus();
      lastFocus = null;
    };

    const onEnd = (event) => {
      if (event.target !== modal) return;
      modal.removeEventListener("transitionend", onEnd);
      settle();
    };

    modal.addEventListener("transitionend", onEnd);
    window.setTimeout(settle, 320);
  }

  items.forEach((item) => {
    const btn = item.querySelector("[data-work-open]");
    btn?.addEventListener("click", () => openModal(item, btn));
  });

  prevBtn?.addEventListener("click", (event) => {
    event.stopPropagation();
    showSlide(slideIndex - 1);
  });

  nextBtn?.addEventListener("click", (event) => {
    event.stopPropagation();
    showSlide(slideIndex + 1);
  });

  // 좌우 드래그 / 스와이프로 슬라이드
  const swipeArea = mediaEl;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragging = false;
  let dragLocked = false;
  const SWIPE_THRESHOLD = 48;

  function onPointerDown(event) {
    if (slideImages.length < 2) return;
    if (event.target.closest(".work-slider-btn")) return;

    dragging = true;
    dragLocked = false;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    swipeArea.classList.add("is-dragging");
    swipeArea.setPointerCapture?.(event.pointerId);
  }

  function onPointerMove(event) {
    if (!dragging) return;

    const dx = event.clientX - dragStartX;
    const dy = event.clientY - dragStartY;

    if (!dragLocked && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
      dragLocked = true;
    }

    if (dragLocked) {
      event.preventDefault();
    }
  }

  function onPointerUp(event) {
    if (!dragging) return;

    const dx = event.clientX - dragStartX;
    swipeArea.classList.remove("is-dragging");
    dragging = false;
    dragLocked = false;

    if (event.pointerId != null) {
      try {
        swipeArea.releasePointerCapture?.(event.pointerId);
      } catch (_) {
        /* already released */
      }
    }

    if (slideImages.length < 2) return;
    if (Math.abs(dx) < SWIPE_THRESHOLD) return;

    if (dx < 0) showSlide(slideIndex + 1);
    else showSlide(slideIndex - 1);
  }

  function onPointerCancel(event) {
    dragging = false;
    dragLocked = false;
    swipeArea.classList.remove("is-dragging");
    if (event?.pointerId != null) {
      try {
        swipeArea.releasePointerCapture?.(event.pointerId);
      } catch (_) {
        /* already released */
      }
    }
  }

  swipeArea.addEventListener("pointerdown", onPointerDown);
  swipeArea.addEventListener("pointermove", onPointerMove, { passive: false });
  swipeArea.addEventListener("pointerup", onPointerUp);
  swipeArea.addEventListener("pointercancel", onPointerCancel);

  modal.querySelectorAll("[data-work-close]").forEach((el) => {
    el.addEventListener("click", closeModal);
  });

  document.addEventListener("keydown", (event) => {
    if (modal.hidden) return;

    if (event.key === "Escape") {
      closeModal();
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showSlide(slideIndex - 1);
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      showSlide(slideIndex + 1);
    }
  });
})();
