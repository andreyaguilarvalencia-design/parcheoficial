
(() => {
  "use strict";

  const gallery = document.querySelector(".full-gallery");
  const lightbox = document.querySelector("#gallery-lightbox");

  if (!gallery || !lightbox) return;

  const items = Array.from(
    gallery.querySelectorAll("[data-gallery-item]")
  );

  const content = lightbox.querySelector(".lightbox-content");
  const counter = lightbox.querySelector(".lightbox-counter");
  const closeButton = lightbox.querySelector(".lightbox-close");
  const previousButton = lightbox.querySelector(".lightbox-prev");
  const nextButton = lightbox.querySelector(".lightbox-next");

  let currentIndex = 0;
  let lastFocusedElement = null;
  let touchStartX = 0;
  let touchStartY = 0;

  // Actualiza el año del footer.
  const year = document.querySelector("#current-year");

  if (year) {
    year.textContent = String(new Date().getFullYear());
  }

  // Abre una fotografía o un vídeo en el visor.
  function showItem(index) {
    if (!items.length) return;

    currentIndex = (index + items.length) % items.length;

    const item = items[currentIndex];
    const originalVideo = item.querySelector("video");
    const originalImage = item.querySelector("img");

    content.replaceChildren();

    if (originalVideo || item.hasAttribute("data-gallery-video")) {
      const player = document.createElement("video");
      const source = originalVideo?.querySelector("source");

      player.controls = true;
      player.autoplay = true;
      player.playsInline = true;
      player.preload = "metadata";

      player.setAttribute("aria-label", "Vídeo de la galería");

      player.src =
        source?.src ||
        originalVideo?.currentSrc ||
        item.href;

      content.appendChild(player);

      const playPromise = player.play();

      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {
          // Si el navegador bloquea el autoplay,
          // el usuario podrá iniciar el vídeo con los controles.
        });
      }
    } else if (originalImage) {
      const enlargedImage = document.createElement("img");

      enlargedImage.src = originalImage.currentSrc || originalImage.src;
      enlargedImage.alt = originalImage.alt || "Imagen de la galería";
      enlargedImage.draggable = false;

      content.appendChild(enlargedImage);
    }

    counter.textContent = `${currentIndex + 1} / ${items.length}`;

    previousButton.disabled = items.length < 2;
    nextButton.disabled = items.length < 2;
  }

  // Abre el visor.
  function openLightbox(index) {
    lastFocusedElement = document.activeElement;

    showItem(index);

    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("gallery-lightbox-open");

    closeButton.focus();
  }

  // Cierra el visor y detiene cualquier vídeo.
  function closeLightbox() {
    if (!lightbox.classList.contains("is-open")) return;

    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.classList.remove("gallery-lightbox-open");

    content.replaceChildren();

    if (
      lastFocusedElement &&
      typeof lastFocusedElement.focus === "function"
    ) {
      lastFocusedElement.focus();
    }
  }

  // Navegación por las fotos y los vídeos.
  function showPrevious() {
    showItem(currentIndex - 1);
  }

  function showNext() {
    showItem(currentIndex + 1);
  }

  items.forEach((item, index) => {
    item.addEventListener("click", (event) => {
      event.preventDefault();
      openLightbox(index);
    });
  });

  closeButton.addEventListener("click", closeLightbox);
  previousButton.addEventListener("click", showPrevious);
  nextButton.addEventListener("click", showNext);

  // Cierra al pulsar fuera del contenido.
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });

  // Controles de teclado.
  document.addEventListener("keydown", (event) => {
    if (!lightbox.classList.contains("is-open")) return;

    if (event.key === "Escape") {
      event.preventDefault();
      closeLightbox();
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showPrevious();
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      showNext();
    }

    // Mantiene el foco dentro del visor al pulsar Tab.
    if (event.key === "Tab") {
      const controls = [
        closeButton,
        previousButton,
        nextButton
      ].filter((button) => !button.disabled);

      if (!controls.length) return;

      const first = controls[0];
      const last = controls[controls.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === last
      ) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  // Permite cambiar de elemento deslizando el dedo en el móvil.
  lightbox.addEventListener(
    "touchstart",
    (event) => {
      const touch = event.changedTouches[0];

      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
    },
    { passive: true }
  );

  lightbox.addEventListener(
    "touchend",
    (event) => {
      if (!lightbox.classList.contains("is-open")) return;

      const touch = event.changedTouches[0];
      const differenceX = touch.clientX - touchStartX;
      const differenceY = touch.clientY - touchStartY;

      // Solo cambia de elemento si el gesto es horizontal.
      if (
        Math.abs(differenceX) > 60 &&
        Math.abs(differenceX) > Math.abs(differenceY)
      ) {
        if (differenceX < 0) {
          showNext();
        } else {
          showPrevious();
        }
      }
    },
    { passive: true }
  );

  // Vista previa del vídeo al pasar el ratón.
  // En móviles, el vídeo se abre al pulsar su tarjeta.
  const videoItems = gallery.querySelectorAll(".video-gallery-item");

  videoItems.forEach((item) => {
    const video = item.querySelector("video");

    if (!video) return;

    item.addEventListener("mouseenter", () => {
      if (window.matchMedia("(hover: hover)").matches) {
        video.play().catch(() => {});
      }
    });

    item.addEventListener("mouseleave", () => {
      video.pause();

      try {
        video.currentTime = 0;
      } catch (_) {
        // El vídeo puede no haber terminado de cargar.
      }
    });
  });

  // El enlace del footer vuelve al inicio de la página.
  const footerTop = document.querySelector(".footer-back-top");

  if (footerTop) {
    footerTop.addEventListener("click", (event) => {
      event.preventDefault();

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    });
  }
})();
