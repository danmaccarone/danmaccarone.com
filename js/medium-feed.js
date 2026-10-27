/* Live Medium feed for the Writing section.
   Runs in the visitor's browser (not the build sandbox), so it reaches
   medium.com even though the cloud build environment can't.

   Medium doesn't expose CORS-friendly JSON, so we go through a public
   RSS->JSON bridge, then fall back to AllOrigins (raw XML), then to a
   plain "read on Medium" link if both are unavailable. */

(function () {
  var FEED = "https://medium.com/feed/@danmaccarone";
  var MAX = 6;
  var el = document.getElementById("medium-feed");
  if (!el) return;

  function fmtDate(str) {
    var d = new Date(str);
    if (isNaN(d)) return "";
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  }

  function stripHtml(html) {
    var tmp = document.createElement("div");
    tmp.innerHTML = html || "";
    return (tmp.textContent || tmp.innerText || "").trim();
  }

  function firstImage(html) {
    var m = /<img[^>]+src=["']([^"']+)["']/i.exec(html || "");
    return m ? m[1] : "";
  }

  function card(item) {
    var a = document.createElement("a");
    a.className = "card";
    a.href = item.link;
    a.target = "_blank";
    a.rel = "noopener";

    var img = item.thumbnail || firstImage(item.content || item.description);
    if (img) {
      var thumb = document.createElement("div");
      thumb.className = "card__thumb";
      thumb.style.backgroundImage = "url('" + img + "')";
      a.appendChild(thumb);
    }

    var body = document.createElement("div");
    body.className = "card__body";

    var date = document.createElement("span");
    date.className = "card__date";
    date.textContent = fmtDate(item.pubDate);

    var title = document.createElement("h3");
    title.className = "card__title";
    title.textContent = item.title;

    var excerpt = document.createElement("p");
    excerpt.className = "card__excerpt";
    excerpt.textContent = stripHtml(item.description || item.content).slice(0, 180);

    body.appendChild(date);
    body.appendChild(title);
    body.appendChild(excerpt);
    a.appendChild(body);
    return a;
  }

  function render(items) {
    el.innerHTML = "";
    items.slice(0, MAX).forEach(function (it) { el.appendChild(card(it)); });
    el.setAttribute("aria-busy", "false");
  }

  function fallback() {
    el.innerHTML =
      '<p class="feed__error">Couldn\'t load the live feed right now. ' +
      '<a href="https://medium.com/@danmaccarone" target="_blank" rel="noopener">Read Dan\'s writing on Medium &rarr;</a></p>';
    el.setAttribute("aria-busy", "false");
  }

  // 1) rss2json bridge
  function tryRss2Json() {
    return fetch("https://api.rss2json.com/v1/api.json?rss_url=" + encodeURIComponent(FEED))
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data && data.status === "ok" && data.items && data.items.length) { render(data.items); return true; }
        throw new Error("rss2json empty");
      });
  }

  // 2) AllOrigins raw XML, parsed client-side
  function tryAllOrigins() {
    return fetch("https://api.allorigins.win/raw?url=" + encodeURIComponent(FEED))
      .then(function (r) { return r.text(); })
      .then(function (xml) {
        var doc = new DOMParser().parseFromString(xml, "text/xml");
        var nodes = Array.prototype.slice.call(doc.querySelectorAll("item"));
        if (!nodes.length) throw new Error("no items");
        var items = nodes.map(function (n) {
          var get = function (t) { var e = n.querySelector(t); return e ? e.textContent : ""; };
          var content = get("encoded") || get("description");
          return { title: get("title"), link: get("link"), pubDate: get("pubDate"), description: content, content: content, thumbnail: "" };
        });
        render(items);
        return true;
      });
  }

  tryRss2Json().catch(tryAllOrigins).catch(fallback);
})();
