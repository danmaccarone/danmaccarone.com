/* Writing section feed.
   Primary source: medium.json (same-origin, committed with the site) — always
   loads, no CORS. Then a best-effort live refresh from medium.com via public
   CORS proxies; if any works, the cards update to the latest, otherwise the
   baked data stays. Regenerate medium.json to refresh the baked copy. */

(function () {
  var el = document.getElementById("medium-feed");
  if (!el) return;
  var MAX = 6;
  var MEDIUM = "https://medium.com/@danmaccarone";
  var FEED = "https://medium.com/feed/@danmaccarone";

  function card(it) {
    var a = document.createElement("a");
    a.className = "card";
    a.href = it.link; a.target = "_blank"; a.rel = "noopener";
    if (it.thumbnail) {
      var t = document.createElement("div");
      t.className = "card__thumb";
      t.style.backgroundImage = "url('" + it.thumbnail + "')";
      a.appendChild(t);
    }
    var b = document.createElement("div"); b.className = "card__body";
    var d = document.createElement("span"); d.className = "card__date"; d.textContent = it.date || "";
    var h = document.createElement("h3"); h.className = "card__title"; h.textContent = it.title || "";
    var p = document.createElement("p"); p.className = "card__excerpt"; p.textContent = it.excerpt || "";
    b.appendChild(d); b.appendChild(h); b.appendChild(p);
    a.appendChild(b);
    return a;
  }

  function render(items) {
    if (!items || !items.length) return false;
    el.innerHTML = "";
    items.slice(0, MAX).forEach(function (it) { el.appendChild(card(it)); });
    el.setAttribute("aria-busy", "false");
    return true;
  }

  function fallback() {
    el.innerHTML = '<p class="feed__error">Read Dan\'s latest on ' +
      '<a href="' + MEDIUM + '" target="_blank" rel="noopener">Medium &rarr;</a></p>';
    el.setAttribute("aria-busy", "false");
  }

  // 1) Baked, same-origin — reliable
  fetch("medium.json", { cache: "no-cache" })
    .then(function (r) { if (!r.ok) throw new Error("no json"); return r.json(); })
    .then(function (d) { if (!render(d && d.items)) fallback(); })
    .catch(fallback)
    .then(liveRefresh);

  // 2) Best-effort live refresh (silent on failure)
  function liveRefresh() {
    var proxies = [
      "https://api.allorigins.win/raw?url=" + encodeURIComponent(FEED),
      "https://corsproxy.io/?url=" + encodeURIComponent(FEED),
      "https://api.codetabs.com/v1/proxy/?quest=" + FEED
    ];
    (function attempt(i) {
      if (i >= proxies.length) return;
      fetch(proxies[i])
        .then(function (r) { if (!r.ok) throw new Error(); return r.text(); })
        .then(function (xml) {
          var items = parseFeed(xml);
          if (items.length) render(items); else throw new Error();
        })
        .catch(function () { attempt(i + 1); });
    })(0);
  }

  function parseFeed(xml) {
    try {
      var doc = new DOMParser().parseFromString(xml, "text/xml");
      var nodes = Array.prototype.slice.call(doc.querySelectorAll("item"));
      return nodes.slice(0, MAX).map(function (n) {
        function g(t) { var e = n.getElementsByTagName(t)[0]; return e ? e.textContent : ""; }
        var content = g("encoded") || g("description") || "";
        var im = /<img[^>]+src=["']([^"']+)["']/.exec(content);
        var txt = content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        var d = new Date(g("pubDate"));
        var date = isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
        return {
          title: g("title"), link: g("link"), date: date,
          excerpt: txt.length > 155 ? txt.slice(0, 155).replace(/\s+\S*$/, "") + "…" : txt,
          thumbnail: im ? im[1] : ""
        };
      });
    } catch (e) { return []; }
  }
})();
