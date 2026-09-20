(function () {
  const root = document.documentElement;
  const themeToggle = document.querySelector("[data-theme-toggle]");
  const guides = [
    { file: "water.html", title: "Water", summary: "Find, collect, treat, store, and ration safe drinking water." },
    { file: "fire.html", title: "Fire & Heat", summary: "Create heat and cooking fire safely while preventing fire and carbon-monoxide danger." },
    { file: "shelter.html", title: "Shelter", summary: "Stay dry, choose a safe space, conserve warmth, and know when to leave." },
    { file: "food.html", title: "Food", summary: "Store familiar food, conserve fuel and water, rotate supplies, and cook simply." },
    { file: "sprouting.html", title: "Sprouting", summary: "Turn stored seed into fresh food with clean water, drainage, and careful hygiene." },
    { file: "land.html", title: "Food From the Land", summary: "Learn local edible plants, avoid dangerous look-alikes, and harvest responsibly." },
    { file: "sanitation.html", title: "Sanitation", summary: "Contain waste, protect water, wash hands, and create a backup toilet system." },
    { file: "first-aid.html", title: "First Aid & Medicine", summary: "Control immediate problems, recognize emergencies, and protect essential medicines." },
    { file: "tools.html", title: "Tools", summary: "Choose, maintain, and safely use dependable hand tools and repair supplies." },
    { file: "light-power.html", title: "Light, Power & Communication", summary: "See safely, conserve backup power, operate generators correctly, and stay connected." },
    { file: "people.html", title: "People & Community", summary: "Share skills, assign backups, check on people, and organize information and supplies." },
    { file: "practice.html", title: "Practice", summary: "Turn written knowledge into ability through safe drills and after-action reviews." }
  ];

  function readTheme() {
    const match = window.name.match(/(?:^|;)emergencyTheme=(light|dark)(?:;|$)/);
    if (match) return match[1];
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function rememberTheme(theme) {
    window.name = window.name
      .replace(/(?:^|;)emergencyTheme=(light|dark)(?:;|$)/, "")
      .replace(/^;+|;+$/g, "");
    window.name += (window.name ? ";" : "") + "emergencyTheme=" + theme;
  }

  function setTheme(theme, save) {
    root.setAttribute("data-theme", theme);
    if (themeToggle) {
      themeToggle.setAttribute("aria-label", "Switch to " + (theme === "dark" ? "light" : "dark") + " mode");
      themeToggle.innerHTML = theme === "dark"
        ? '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>'
        : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"/></svg>';
    }
    if (save) rememberTheme(theme);
  }

  setTheme(readTheme(), false);
  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      setTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark", true);
    });
  }

  function createSearch() {
    const header = document.querySelector(".site-header");
    if (!header || !themeToggle) return;

    const button = document.createElement("button");
    button.className = "search-toggle";
    button.type = "button";
    button.setAttribute("aria-label", "Search all 12 guides");
    button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg>';
    header.insertBefore(button, themeToggle);

    const dialog = document.createElement("dialog");
    dialog.className = "search-dialog";
    dialog.innerHTML = [
      '<div class="search-panel">',
      '<div class="search-heading"><div><p class="section-kicker">All 12 guides</p><h2>Search emergency basics</h2></div><button class="search-close" type="button" aria-label="Close search">×</button></div>',
      '<label class="search-field"><span>Search by skill, supply, or problem</span><input type="search" autocomplete="off" placeholder="Try “generator,” “bleeding,” or “water”"></label>',
      '<p class="search-status" aria-live="polite">Choose a guide or enter a search term.</p>',
      '<div class="search-results"></div>',
      '</div>'
    ].join("");
    document.body.appendChild(dialog);

    const input = dialog.querySelector("input");
    const results = dialog.querySelector(".search-results");
    const status = dialog.querySelector(".search-status");
    let searchIndex = guides.map(function (guide) {
      return Object.assign({}, guide, { text: (guide.title + " " + guide.summary).toLowerCase() });
    });
    let indexPromise = null;

    function render(query) {
      const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
      const matches = searchIndex.filter(function (guide) {
        return words.every(function (word) { return guide.text.includes(word); });
      });
      results.innerHTML = "";
      (words.length ? matches : searchIndex).forEach(function (guide) {
        const link = document.createElement("a");
        link.className = "search-result";
        link.href = "./" + guide.file;
        link.innerHTML = "<strong>" + guide.title + "</strong><span>" + guide.summary + "</span>";
        results.appendChild(link);
      });
      status.textContent = words.length
        ? matches.length + (matches.length === 1 ? " guide found." : " guides found.")
        : "Choose a guide or enter a search term.";
    }

    function loadGuideIndex() {
      if (indexPromise) return indexPromise;
      status.textContent = "Loading all 12 guides…";
      indexPromise = Promise.all(guides.map(function (guide) {
        return fetch("./" + guide.file)
          .then(function (response) { return response.ok ? response.text() : ""; })
          .then(function (html) {
            const documentCopy = new DOMParser().parseFromString(html, "text/html");
            return Object.assign({}, guide, {
              text: (guide.title + " " + guide.summary + " " + documentCopy.body.textContent).toLowerCase()
            });
          })
          .catch(function () { return searchIndex.find(function (item) { return item.file === guide.file; }); });
      })).then(function (loaded) {
        searchIndex = loaded;
        if (dialog.open) render(input.value);
      });
      return indexPromise;
    }

    button.addEventListener("click", function () {
      dialog.showModal();
      render("");
      input.focus();
      loadGuideIndex();
    });
    dialog.querySelector(".search-close").addEventListener("click", function () { dialog.close(); });
    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) dialog.close();
    });
    input.addEventListener("input", function () { render(input.value); });
  }

  function createMobileContents() {
    const toc = document.querySelector(".guide-toc");
    const layout = document.querySelector(".guide-layout");
    const content = document.querySelector(".guide-content");
    if (!toc || !layout || !content) return;
    const details = document.createElement("details");
    details.className = "mobile-toc";
    details.innerHTML = '<summary>Jump to a section</summary><nav aria-label="Mobile guide contents"></nav>';
    const nav = details.querySelector("nav");
    toc.querySelectorAll("a").forEach(function (link) {
      nav.appendChild(link.cloneNode(true));
    });
    nav.addEventListener("click", function () { details.open = false; });
    layout.insertBefore(details, content);
  }

  function createGuideSequence() {
    const actions = document.querySelector(".guide-actions");
    if (!actions) return;
    const current = location.pathname.split("/").pop();
    const index = guides.findIndex(function (guide) { return guide.file === current; });
    if (index < 0) return;
    const nav = document.createElement("nav");
    nav.className = "guide-sequence";
    nav.setAttribute("aria-label", "Previous and next guides");
    const previous = index > 0 ? guides[index - 1] : null;
    const next = index < guides.length - 1 ? guides[index + 1] : null;
    nav.innerHTML =
      (previous
        ? '<a href="./' + previous.file + '"><span>Previous</span><strong>← ' + previous.title + '</strong></a>'
        : '<a href="./index.html#skills"><span>Previous</span><strong>← All skills</strong></a>') +
      (next
        ? '<a href="./' + next.file + '"><span>Next</span><strong>' + next.title + ' →</strong></a>'
        : '<a href="./index.html#skills"><span>Complete</span><strong>All 12 skills →</strong></a>');
    actions.parentNode.insertBefore(nav, actions);
  }

  createSearch();
  createMobileContents();
  createGuideSequence();

  document.querySelectorAll(".expand-button").forEach(function (button) {
    if (button.tagName === "A") return;
    button.addEventListener("click", function () {
      const panel = document.getElementById(button.getAttribute("aria-controls"));
      const isOpen = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", String(!isOpen));
      panel.classList.toggle("is-open", !isOpen);
    });
  });

  const preparedPrintFiles = new Map();

  function isPhoneOrTablet() {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (navigator.maxTouchPoints > 1 && window.matchMedia("(pointer: coarse)").matches);
  }

  function preparePrintFile(url, filename) {
    if (!url || preparedPrintFiles.has(url)) return;
    preparedPrintFiles.set(url, null);
    fetch(url)
      .then(function (response) {
        if (!response.ok) throw new Error("PDF unavailable");
        return response.blob();
      })
      .then(function (blob) {
        preparedPrintFiles.set(url, new File([blob], filename, { type: "application/pdf" }));
      })
      .catch(function () {
        preparedPrintFiles.delete(url);
      });
  }

  function showMobilePrintHelp(url) {
    let dialog = document.querySelector("[data-mobile-print-help]");
    if (!dialog) {
      dialog = document.createElement("dialog");
      dialog.className = "mobile-print-help";
      dialog.setAttribute("data-mobile-print-help", "");
      dialog.innerHTML = [
        '<div class="mobile-print-help-inner">',
        "<p class=\"eyebrow\">Print from your phone</p>",
        "<h2>Open the printable PDF</h2>",
        "<p><strong>iPhone or iPad:</strong> Open the PDF, tap Share, then choose Print.</p>",
        "<p><strong>Android:</strong> Open the PDF, use the menu or Share control, then choose Print.</p>",
        '<div class="mobile-print-help-actions">',
        '<a class="button primary" data-open-print-pdf>Open Printable PDF</a>',
        '<button class="button secondary" type="button" data-close-print-help>Cancel</button>',
        "</div></div>"
      ].join("");
      document.body.appendChild(dialog);
      dialog.querySelector("[data-close-print-help]").addEventListener("click", function () {
        if (typeof dialog.close === "function") {
          dialog.close();
        } else {
          dialog.removeAttribute("open");
        }
      });
    }
    dialog.querySelector("[data-open-print-pdf]").href = url;
    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
  }

  function printCurrentSkill(button) {
    const chapter = button.closest(".complete-chapter");
    if (!chapter) {
      window.print();
      return;
    }

    document.body.classList.add("print-one-chapter");
    chapter.classList.add("is-print-target");
    const cleanup = function () {
      document.body.classList.remove("print-one-chapter");
      chapter.classList.remove("is-print-target");
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    window.print();
    window.setTimeout(cleanup, 30000);
  }

  function connectPrintActions(root) {
    const scope = root || document;
    const currentFile = location.pathname.split("/").pop() || "";
    const defaultPdf = currentFile === "complete-guide.html"
      ? "./print/complete-guide.pdf"
      : "./print/" + currentFile.replace(/\.html$/, ".pdf");

    scope.querySelectorAll("[data-print-guide], [data-print-page]").forEach(function (printButton) {
      if (printButton.dataset.printReady === "true") return;
      printButton.dataset.printReady = "true";
      if (printButton.hasAttribute("data-print-guide")) {
        printButton.textContent = "Print This Skill";
        printButton.setAttribute("aria-label", "Print this skill");
      }
      const pdfUrl = printButton.getAttribute("data-print-pdf") || defaultPdf;
      const filename = printButton.getAttribute("data-print-filename") ||
        pdfUrl.split("/").pop() || "printable-guide.pdf";
      preparePrintFile(pdfUrl, filename);

      printButton.addEventListener("click", function () {
        if (!isPhoneOrTablet()) {
          printCurrentSkill(printButton);
          return;
        }

        const file = preparedPrintFiles.get(pdfUrl);
        const canShareFile = file && navigator.share &&
          (!navigator.canShare || navigator.canShare({ files: [file] }));
        if (canShareFile) {
          navigator.share({
            files: [file],
            title: document.title,
            text: "Printable emergency guide"
          }).catch(function (error) {
            if (error.name !== "AbortError") showMobilePrintHelp(pdfUrl);
          });
          return;
        }
        showMobilePrintHelp(pdfUrl);
      });
    });
  }

  window.prepareGuidePrintActions = connectPrintActions;
  connectPrintActions();

  function placePrioritiesInView() {
    const priorities = document.getElementById("priorities");
    if (!priorities) return;
    const header = document.querySelector(".site-header");
    const offset = (header ? header.offsetHeight : 68) + 12;
    const previousScrollBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.scrollTo(0, window.scrollY + priorities.getBoundingClientRect().top - offset);
    window.requestAnimationFrame(function () {
      root.style.scrollBehavior = previousScrollBehavior;
    });
  }

  function settleAtPriorities() {
    placePrioritiesInView();
    window.setTimeout(placePrioritiesInView, 300);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(placePrioritiesInView);
    }
  }

  document.querySelectorAll("[data-priorities-link]").forEach(function (link) {
    link.addEventListener("click", function (event) {
      const priorities = document.getElementById("priorities");
      if (!priorities) return;
      event.preventDefault();
      history.replaceState(null, "", "#priorities");
      settleAtPriorities();
    });
  });

  if (location.hash === "#priorities") {
    window.addEventListener("load", function () {
      settleAtPriorities();
    });
  }
})();

// Simple slide-in menu (Stage 1 redesign)
(function () {
  const toggle = document.querySelector("[data-menu-toggle]");
  const drawer = document.querySelector("[data-simple-menu]");
  const overlay = document.querySelector("[data-menu-overlay]");
  const closeBtn = document.querySelector("[data-menu-close]");
  if (!toggle || !drawer || !overlay) return;

  function openMenu() {
    drawer.hidden = false;
    overlay.hidden = false;
    requestAnimationFrame(function () {
      drawer.classList.add("is-open");
      overlay.classList.add("is-open");
    });
    toggle.setAttribute("aria-expanded", "true");
  }

  function closeMenu() {
    drawer.classList.remove("is-open");
    overlay.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    window.setTimeout(function () {
      drawer.hidden = true;
      overlay.hidden = true;
    }, 220);
  }

  toggle.addEventListener("click", function () {
    if (drawer.classList.contains("is-open")) closeMenu();
    else openMenu();
  });
  overlay.addEventListener("click", closeMenu);
  if (closeBtn) closeBtn.addEventListener("click", closeMenu);
  drawer.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", closeMenu);
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeMenu();
  });
})();
