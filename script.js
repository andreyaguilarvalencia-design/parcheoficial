
(() => {
  "use strict";

  const menuButton = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".main-nav");
  const backTop = document.querySelector(".back-top");
  const yearElement = document.querySelector("#current-year");

  if (yearElement) {
    yearElement.textContent = String(new Date().getFullYear());
  }

  // MENÚ MÓVIL
  if (menuButton && nav) {
    const closeMenu = () => {
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.setAttribute("aria-label", "Abrir menú");
      nav.classList.remove("is-open");
      document.body.classList.remove("menu-open");
    };

    menuButton.addEventListener("click", () => {
      const isOpen =
        menuButton.getAttribute("aria-expanded") === "true";

      if (isOpen) {
        closeMenu();
      } else {
        menuButton.setAttribute("aria-expanded", "true");
        menuButton.setAttribute("aria-label", "Cerrar menú");
        nav.classList.add("is-open");
        document.body.classList.add("menu-open");
      }
    });

    nav.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape") closeMenu();
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 680) closeMenu();
    });
  }

  // ANIMACIONES AL DESPLAZARSE
  const revealElements = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          currentObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: "0px 0px -30px 0px"
    });

    revealElements.forEach(element => observer.observe(element));
  } else {
    revealElements.forEach(element => {
      element.classList.add("is-visible");
    });
  }

  // BOTÓN VOLVER ARRIBA
  if (backTop) {
    const updateBackTop = () => {
      backTop.classList.toggle("visible", window.scrollY > 500);
    };

    window.addEventListener("scroll", updateBackTop, {
      passive: true
    });

    updateBackTop();

    backTop.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    });
  }

  // CONTROL DE IMÁGENES DE LA GALERÍA
  document.querySelectorAll(".gallery-item img").forEach(image => {
    image.addEventListener("error", () => {
      image.classList.add("image-unavailable");
      image.alt = "Imagen pendiente de añadir";
    });
  });

  // PESTAÑAS DE EVENTOS
  const upcomingTab = document.querySelector("#tab-upcoming");
  const pastTab = document.querySelector("#tab-past");
  const upcomingView = document.querySelector("#upcoming-view");
  const pastView = document.querySelector("#past-view");
  const eventsLabel = document.querySelector("#events-label");
  const eventsTitle = document.querySelector("#events-title");
  const eventsIntro = document.querySelector("#events-intro");
  const eventsEyebrowIndex = document.querySelector(
    "#events-eyebrow .section-index"
  );
  const footerPastEvents = document.querySelector("#footer-past-events");

  function showEventsView(view) {
    const showPast = view === "past";

    if (!upcomingTab || !pastTab || !upcomingView || !pastView) {
      return;
    }

    upcomingView.hidden = showPast;
    pastView.hidden = !showPast;

    upcomingTab.classList.toggle("active", !showPast);
    pastTab.classList.toggle("active", showPast);

    upcomingTab.setAttribute("aria-selected", String(!showPast));
    pastTab.setAttribute("aria-selected", String(showPast));

    if (eventsLabel) {
      eventsLabel.textContent = showPast
        ? "EVENTOS PASADOS"
        : "PRÓXIMOS PLANES";
    }

    if (eventsTitle) {
      eventsTitle.innerHTML = showPast
        ? "NOCHES QUE<br><span>YA VIVIMOS.</span>"
        : "EL PLAN ESTÁ<br><span>FUERA.</span>";
    }

    if (eventsIntro) {
      eventsIntro.textContent = showPast
        ? "Revive los eventos que ya han formado parte de la historia del Parche."
        : "Los eventos que no te quieres perder, con opciones para conseguir tus entradas.";
    }

    if (eventsEyebrowIndex) {
      eventsEyebrowIndex.textContent = showPast ? "02 /" : "01 /";
    }
  }

  if (upcomingTab) {
    upcomingTab.addEventListener("click", () => {
      showEventsView("upcoming");
    });
  }

  if (pastTab) {
    pastTab.addEventListener("click", () => {
      showEventsView("past");
    });
  }

  if (footerPastEvents) {
    footerPastEvents.addEventListener("click", () => {
      showEventsView("past");
    });
  }

  showEventsView("upcoming");

  // CONEXIÓN CON SUPABASE
  const upcomingContainer = document.querySelector("#public-events");
  const pastContainer = document.querySelector("#past-events");
  const config = window.PARCHE_CONFIG || {};

  const configured =
    typeof config.SUPABASE_URL === "string" &&
    typeof config.SUPABASE_ANON_KEY === "string" &&
    config.SUPABASE_URL.startsWith("https://") &&
    config.SUPABASE_ANON_KEY.length > 0;

  // ESCAPAR TEXTO PARA EVITAR INSERTAR HTML NO DESEADO
  const esc = value =>
    String(value ?? "").replace(/[&<>"']/g, character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);

  // FECHA LOCAL
  function getLocalDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function prettyDate(value) {
    if (!value) return "FECHA POR CONFIRMAR";

    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value));

    if (!match) return esc(value);

    const date = new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3])
    );

    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }).format(date);
  }

  // CARTEL DEL EVENTO
  function renderPoster(event, index) {
    const styles = ["one", "two", "three"];
    const visualClass =
      `ticket-visual-${styles[index % styles.length]}`;

    const city = esc(event.city || "BARCELONA");
    const number = String(index + 1).padStart(2, "0");

    if (event.poster_data) {
      const posterData = String(event.poster_data);

      // Aceptar únicamente imágenes base64 de tipos permitidos.
      if (
        /^data:image\/(?:jpeg|jpg|png|webp|gif);base64,/i.test(posterData)
      ) {
        const safePoster = esc(posterData);

        return `
          <div
            class="ticket-visual ${visualClass} event-poster"
            style="background-image: linear-gradient(0deg, rgba(16,11,23,.85), rgba(16,11,23,.05)), url('${safePoster}')"
          >
            <span class="visual-number">${number}</span>
            <span class="visual-word">${city}</span>
          </div>
        `;
      }
    }

    return `
      <div class="ticket-visual ${visualClass}">
        <span class="visual-number">${number}</span>
        <span class="visual-word">${city}</span>
      </div>
    `;
  }

  // TARJETA DE EVENTO
  function renderEvent(event, index, isPast) {
    const place = [event.city, event.venue]
      .filter(Boolean)
      .map(esc)
      .join(" · ");

    const poster = renderPoster(event, index);

    const title = esc(event.title).replace(/\n/g, "<br>");

    const description = esc(
      event.description ||
      "Descubre este evento y prepárate para vivir la escena urbana."
    );

    const time = event.event_time
      ? ` · ${esc(String(event.event_time).slice(0, 5))}`
      : "";

    let link = `
      <span class="text-link tickets-no-link">
        INFORMACIÓN PRÓXIMAMENTE
      </span>
    `;

    if (isPast) {
      link = `
        <span class="text-link past-event-label">
          EVENTO FINALIZADO
        </span>
      `;
    } else if (event.ticket_url) {
      try {
        const url = new URL(event.ticket_url);

        if (url.protocol === "https:" || url.protocol === "http:") {
          link = `
            <a
              class="text-link"
              href="${esc(url.href)}"
              target="_blank"
              rel="noopener noreferrer"
            >
              CONSIGUE TUS ENTRADAS <span>↗</span>
            </a>
          `;
        }
      } catch {
        console.warn("El enlace de un evento no es válido.");
      }
    }

    return `
      <article class="ticket-card reveal ${isPast ? "ticket-card-past" : ""}">
        <div class="ticket-card-top">
          <span class="ticket-tag">
            ${isPast ? "EVENTO PASADO" : "ENTRADAS"}
          </span>
          <span class="ticket-arrow">${isPast ? "✓" : "↗"}</span>
        </div>

        ${poster}

        <div class="ticket-card-content">
          <p class="card-category">
            ${prettyDate(event.event_date)}${time}
          </p>

          <h3>${title}</h3>

          <p>
            ${description}
            ${place ? `<br><span class="event-place">${place}</span>` : ""}
          </p>

          ${link}
        </div>
      </article>
    `;
  }

  // MOSTRAR EVENTOS
  function renderEvents(container, events, isPast) {
    if (!container) return;

    if (events.length === 0) {
      container.innerHTML = `
        <p class="events-loading">
          ${
            isPast
              ? "Todavía no hay eventos pasados."
              : "Próximamente anunciaremos nuevos eventos. Vuelve pronto."
          }
        </p>
      `;
      return;
    }

    container.innerHTML = events
      .map((event, index) => renderEvent(event, index, isPast))
      .join("");

    container.querySelectorAll(".reveal").forEach(element => {
      requestAnimationFrame(() => {
        element.classList.add("is-visible");
      });
    });
  }

  // CARGAR EVENTOS DESDE SUPABASE
  async function loadEvents() {
    if (!upcomingContainer && !pastContainer) return;

    if (!configured || !window.supabase) {
      const message = `
        <p class="events-loading">
          No se ha podido iniciar la conexión con la cartelera.
          Comprueba la configuración de Supabase.
        </p>
      `;

      if (upcomingContainer) upcomingContainer.innerHTML = message;
      if (pastContainer) pastContainer.innerHTML = message;
      return;
    }

    try {
      const client = window.supabase.createClient(
        config.SUPABASE_URL,
        config.SUPABASE_ANON_KEY
      );

      const { data, error } = await client
        .from("events")
        .select(
          "id,title,event_date,event_time,city,venue,description,ticket_url,poster_data"
        )
        .eq("published", true)
        .order("event_date", {
          ascending: true,
          nullsFirst: false
        });

      if (error) throw error;

      const events = data || [];
      const today = getLocalDateString();

      const upcomingEvents = events.filter(event => {
        return !event.event_date || event.event_date >= today;
      });

      const pastEvents = events
        .filter(event => {
          return Boolean(event.event_date) && event.event_date < today;
        })
        .sort((a, b) => b.event_date.localeCompare(a.event_date));

      renderEvents(upcomingContainer, upcomingEvents, false);
      renderEvents(pastContainer, pastEvents, true);

    } catch (error) {
      console.error("Error cargando eventos de Supabase:", error);

      const message = `
        <p class="events-loading">
          No se han podido cargar los eventos.
          Comprueba la conexión y los permisos de la base de datos.
        </p>
      `;

      if (upcomingContainer) upcomingContainer.innerHTML = message;
      if (pastContainer) pastContainer.innerHTML = message;
    }
  }

  loadEvents();
})();
