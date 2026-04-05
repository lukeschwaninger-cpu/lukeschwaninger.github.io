(function () {
  const header = document.querySelector(".site-header");
  const mobileQuery = window.matchMedia("(max-width: 900px)");

  function updateHeader() {
    if (!header) return;

    const menuOpen = document.querySelector(".nav-bar.is-open");
    const shouldHide = !mobileQuery.matches && window.scrollY > 12 && !menuOpen;
    header.classList.toggle("is-hidden", shouldHide);
  }

  document.querySelectorAll(".nav-bar").forEach((nav) => {
    const toggle = nav.querySelector(".nav-toggle");
    const panel = nav.querySelector(".nav-panel");

    if (!toggle || !panel) return;

    const closeMenu = () => {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");

      if (mobileQuery.matches) {
        panel.hidden = true;
      }
    };

    const openMenu = () => {
      nav.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
      panel.hidden = false;
    };

    const syncMenuMode = () => {
      if (mobileQuery.matches) {
        panel.hidden = !nav.classList.contains("is-open");
      } else {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        panel.hidden = false;
      }

      updateHeader();
    };

    toggle.addEventListener("click", () => {
      if (nav.classList.contains("is-open")) {
        closeMenu();
      } else {
        openMenu();
      }

      updateHeader();
    });

    panel.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        if (mobileQuery.matches) {
          closeMenu();
          updateHeader();
        }
      });
    });

    document.addEventListener("click", (event) => {
      if (!mobileQuery.matches || !nav.classList.contains("is-open")) return;
      if (nav.contains(event.target)) return;

      closeMenu();
      updateHeader();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || !nav.classList.contains("is-open")) return;

      closeMenu();
      toggle.focus();
      updateHeader();
    });

    if (typeof mobileQuery.addEventListener === "function") {
      mobileQuery.addEventListener("change", syncMenuMode);
    } else {
      mobileQuery.addListener(syncMenuMode);
    }

    syncMenuMode();
  });

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });
  window.addEventListener("resize", updateHeader);
})();
