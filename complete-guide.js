(function () {
  const files = [
    "water.html", "fire.html", "shelter.html", "food.html",
    "sprouting.html", "land.html", "sanitation.html", "first-aid.html",
    "tools.html", "light-power.html", "people.html", "practice.html"
  ];
  const container = document.querySelector("[data-complete-content]");
  const status = document.querySelector("[data-complete-status]");
  const downloadButton = document.querySelector("[data-download-complete]");

  function prefixIds(element, prefix) {
    element.querySelectorAll("[id]").forEach(function (node) {
      node.id = prefix + "-" + node.id;
    });
    element.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.href = "#" + prefix + "-" + link.getAttribute("href").slice(1);
    });
  }

  function makeChapter(html, file, index) {
    const parsed = new DOMParser().parseFromString(html, "text/html");
    const chapter = document.createElement("article");
    chapter.className = "complete-chapter " + parsed.body.className;
    chapter.dataset.source = file;

    const hero = parsed.querySelector(".guide-hero");
    const urgent = parsed.querySelector(".urgent-block");
    const content = parsed.querySelector(".guide-content");
    if (!hero || !urgent || !content) throw new Error("Missing guide structure in " + file);

    const heroCopy = hero.cloneNode(true);
    const urgentCopy = urgent.cloneNode(true);
    const contentCopy = content.cloneNode(true);
    contentCopy.querySelectorAll(".guide-actions").forEach(function (node) { node.remove(); });
    prefixIds(heroCopy, "guide-" + (index + 1));
    prefixIds(urgentCopy, "guide-" + (index + 1));
    prefixIds(contentCopy, "guide-" + (index + 1));
    chapter.append(heroCopy, urgentCopy, contentCopy);
    return chapter;
  }

  function downloadOfflineGuide() {
    Promise.all([
      fetch("./base.css").then(function (response) { return response.text(); }),
      fetch("./style.css").then(function (response) { return response.text(); })
    ]).then(function (styles) {
      const content = container.cloneNode(true);
      content.querySelectorAll(".guide-hero-actions").forEach(function (node) { node.remove(); });
      const offlineCss = [
        ".site-header,.guide-actions,.guide-sequence,.mobile-toc,.search-dialog{display:none!important}",
        ".offline-title{max-width:980px;margin:0 auto;padding:3rem 1rem;border-bottom:2px solid #285d45}",
        ".offline-title h1{max-width:none}",
        ".offline-title p{margin-top:1rem;color:#626458}",
        "@media print{.offline-title{display:none}.complete-chapter{break-before:page}.complete-chapter:first-child{break-before:auto}}"
      ].join("");
      const documentHtml = [
        "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\">",
        "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">",
        "<title>Simple Emergency &amp; Survival Basics — Complete Offline Guide</title>",
        "<style>", styles[0], styles[1], offlineCss, "</style></head>",
        "<body class=\"complete-page\"><header class=\"offline-title\">",
        "<p>COMPLETE OFFLINE EDITION</p><h1>Simple Emergency &amp; Survival Basics</h1>",
        "<p>All 12 essential skills. Use your browser’s Print command to make a paper copy or PDF.</p>",
        "</header><main class=\"complete-content\">", content.innerHTML, "</main></body></html>"
      ].join("");
      const blob = new Blob([documentHtml], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "simple-emergency-survival-basics-offline.html";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    }).catch(function () {
      status.textContent = "The offline file could not be created. Try printing the complete guide instead.";
    });
  }

  Promise.all(files.map(function (file) {
    return fetch("./" + file).then(function (response) {
      if (!response.ok) throw new Error("Could not load " + file);
      return response.text();
    });
  })).then(function (pages) {
    pages.forEach(function (html, index) {
      container.appendChild(makeChapter(html, files[index], index));
    });
    if (window.prepareGuidePrintActions) {
      window.prepareGuidePrintActions(container);
    }
    status.textContent = "All 12 guides are ready to print or download.";
    downloadButton.disabled = false;
    downloadButton.addEventListener("click", downloadOfflineGuide);
  }).catch(function (error) {
    status.classList.add("load-error");
    status.textContent = "The complete edition could not load. Individual guides remain available from the homepage.";
    console.error(error);
  });
})();
