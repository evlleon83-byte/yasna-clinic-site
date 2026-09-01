/*
  ЯСНА site search widget.
  Searches window.SITE_SERVICES (assets/js/search-data.js) by title,
  description and category. Powers the inline dropdown suggestions on every
  page and the full results list on search.html.
*/
(function () {
  "use strict";

  function normalize(s) {
    return (s || "").toString().toLowerCase().replace(/ё/g, "е").trim();
  }

  function escapeHTML(s) {
    return (s || "").toString()
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function getServices() {
    return Array.isArray(window.SITE_SERVICES) ? window.SITE_SERVICES : [];
  }

  // Colloquial / everyday terms mapped to the vocabulary actually used in
  // titles & descriptions, so a search for "ботокс" still finds
  // "Ботулинотерапия", "губы" finds "Контурная пластика", etc.
  var SYNONYMS = {
    "ботокс": ["ботулинотерапия", "морщин"],
    "диспорт": ["ботулинотерапия"],
    "уколы красоты": ["мезотерапия", "биоревитализация"],
    "губы": ["контурная пластика", "филлер"],
    "скулы": ["контурная пластика", "филлер"],
    "филлеры": ["контурная пластика", "коррекция фигуры"],
    "нити": ["нитевой лифтинг"],
    "лифтинг нитями": ["нитевой лифтинг"],
    "чистка": ["чистка лица", "пилинг"],
    "чистка лица": ["пилинг", "механическая", "ультразвуковая"],
    "родинка": ["новообразований"],
    "родинки": ["новообразований"],
    "папиллом": ["новообразований"],
    "татуаж": ["удаление татуировок"],
    "тату": ["удаление татуировок"],
    "пигмент": ["гиперпигментации"],
    "пигментация": ["гиперпигментации"],
    "купероз": ["сосудистой"],
    "сосудистые звездочки": ["купероза"],
    "смас лифтинг": ["smas"],
    "смас": ["smas-лифтинг"],
    "капельница": ["инфузионная"],
    "капельницы": ["инфузионная терапия"],
    "похудение": ["липоредукция", "коррекция фигуры"],
    "жир": ["липоредукция"],
    "фигура": ["коррекция фигуры", "липоредукция"],
    "волосы": ["трихология"],
    "выпадение волос": ["трихология"],
    "морщины": ["ботулинотерапия", "биоревитализация", "мезотерапия"],
    "омоложение": ["лифтинг", "омоложение"],
    "объем губ": ["контурная пластика"],
    "коллаген": ["коллагеностимуляция"],
    "плазма": ["prp-терапия"],
    "плазмолифтинг": ["prp-терапия"],
    "плазмалифтинг": ["prp-терапия"],
    "плазмотерапия": ["prp-терапия"],
    "прыщи": ["чистка", "пилинг"],
    "акне": ["чистка", "пилинг"],
    "эпиляция": ["лазерная эпиляция", "фотоэпиляция"],
    "депиляция": ["лазерная эпиляция", "фотоэпиляция"],
    "консультация": ["online консультации"],
    "нутрициолог": ["нутрициология"],
    "детокс": ["detox"],
    "антиэйдж": ["antiage"],
    "массаж": ["массаж лица", "аппаратные массажи"],
    "события": ["акции", "новости"],
    "акции": ["события"],
    "лицензия": ["документы", "цифровая лицензия"]
  };

  function expandTerms(q) {
    var terms = [q];
    Object.keys(SYNONYMS).forEach(function (key) {
      if (q.indexOf(normalize(key)) !== -1) {
        SYNONYMS[key].forEach(function (t) { terms.push(normalize(t)); });
      }
    });
    return terms;
  }

  function scoreMatch(q, item, weight) {
    var title = normalize(item.title);
    var desc = normalize(item.desc);
    var category = normalize(item.category);
    var score = 0;
    if (title === q) score += 6;
    if (title.indexOf(q) === 0) score += 4;
    else if (title.indexOf(q) !== -1) score += 3;
    if (category.indexOf(q) !== -1) score += 2;
    if (desc.indexOf(q) !== -1) score += 1;
    return score * (weight || 1);
  }

  function search(query, limit) {
    var q = normalize(query);
    if (!q) return [];
    var terms = expandTerms(q);
    return getServices()
      .map(function (item) {
        var score = 0;
        terms.forEach(function (term, i) {
          score = Math.max(score, scoreMatch(term, item, i === 0 ? 1 : 0.85));
        });
        return { item: item, score: score };
      })
      .filter(function (r) { return r.score > 0; })
      .sort(function (a, b) { return b.score - a.score; })
      .slice(0, limit || 8)
      .map(function (r) { return r.item; });
  }

  function suggestionHTML(item) {
    return '<a href="' + escapeHTML(item.url) + '" class="flex items-start gap-3 p-4 hover:bg-[var(--mist)] transition text-left">' +
      '<i class="fa-solid fa-arrow-right text-[var(--silver)] text-xs mt-1.5 shrink-0"></i>' +
      '<span>' +
        '<span class="block serif text-lg text-[var(--graphite)] leading-snug">' + escapeHTML(item.title) + '</span>' +
        (item.category ? '<span class="block text-[10px] uppercase tracking-wide2 text-[var(--silver-deep)] mt-1">' + escapeHTML(item.category) + '</span>' : '') +
        '<span class="block text-[var(--silver-deep)] text-xs mt-1 leading-relaxed">' + escapeHTML(item.desc) + '</span>' +
      '</span>' +
    '</a>';
  }

  function cardHTML(item) {
    return '<a href="' + escapeHTML(item.url) + '" class="group block card p-6">' +
      '<div class="flex items-start justify-between gap-4">' +
        '<h3 class="serif text-2xl text-[var(--graphite)] leading-snug min-w-0 break-words">' + escapeHTML(item.title) + '</h3>' +
      '</div>' +
      (item.category ? '<span class="text-[10px] uppercase tracking-wide2 text-[var(--silver-deep)]">' + escapeHTML(item.category) + '</span>' : '') +
      '<p class="text-[var(--silver-deep)] text-sm mt-3 leading-relaxed">' + escapeHTML(item.desc) + '</p>' +
      '<span class="mt-4 inline-flex items-center gap-2 text-[11px] uppercase tracking-wide2 text-[var(--graphite)]">Подробнее <i class="fa-solid fa-arrow-right text-[10px]"></i></span>' +
    '</a>';
  }

  function initWidget(root) {
    var input = root.querySelector("[data-search-input]");
    var form = root.querySelector("[data-search-form]");
    var box = root.querySelector("[data-search-results]");
    if (!input || !form) return;

    var fullList = document.getElementById("search-results-list");

    function renderDropdown() {
      if (!box) return;
      var q = input.value;
      var results = search(q, 6);
      if (!q.trim() || !results.length) {
        box.classList.add("hidden");
        box.innerHTML = "";
        return;
      }
      box.innerHTML = results.map(suggestionHTML).join("");
      box.classList.remove("hidden");
    }

    function goToResults(q) {
      window.location.href = "search.html?q=" + encodeURIComponent(q);
    }

    input.addEventListener("input", function () {
      renderDropdown();
      if (fullList && window.renderFullSearchResults) {
        window.renderFullSearchResults(input.value);
      }
    });

    input.addEventListener("focus", function () {
      if (input.value.trim()) renderDropdown();
    });

    document.addEventListener("click", function (e) {
      if (box && !root.contains(e.target)) {
        box.classList.add("hidden");
      }
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var q = input.value.trim();
      if (!q) { input.focus(); return; }
      if (fullList && window.renderFullSearchResults) {
        var url = new URL(window.location.href);
        url.searchParams.set("q", q);
        history.replaceState(null, "", url);
        window.renderFullSearchResults(q);
        if (box) box.classList.add("hidden");
      } else {
        goToResults(q);
      }
    });
  }

  window.renderFullSearchResults = function (query) {
    var list = document.getElementById("search-results-list");
    var empty = document.getElementById("search-empty");
    var summary = document.getElementById("search-summary");
    if (!list) return;
    var q = (query || "").trim();
    var results = q ? search(q, 100) : [];
    if (summary) {
      summary.textContent = q
        ? "Результаты по запросу «" + q + "» — найдено: " + results.length
        : "Введите запрос, чтобы найти нужную процедуру.";
    }
    list.innerHTML = results.map(cardHTML).join("");
    if (empty) empty.classList.toggle("hidden", !(q && results.length === 0));
  };

  window.SiteSearch = { search: search };

  document.addEventListener("DOMContentLoaded", function () {
    var widgets = document.querySelectorAll("[data-search-widget]");
    widgets.forEach(initWidget);

    if (document.getElementById("search-results-list")) {
      var params = new URLSearchParams(window.location.search);
      var q = params.get("q") || "";
      var input = document.querySelector("[data-search-widget] [data-search-input]");
      if (input) input.value = q;
      window.renderFullSearchResults(q);
    }
  });
})();
