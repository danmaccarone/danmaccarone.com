#!/usr/bin/env python3
"""Fetch Dan's Medium feed and (re)generate medium.json for the Writing section.

Run locally or from CI (see .github/workflows/refresh-medium.yml). If the feed
can't be fetched or yields no items, medium.json is left unchanged so the site
keeps the last known-good posts.
"""
import datetime
import html
import json
import re
import sys
import urllib.request
from email.utils import parsedate_to_datetime

FEED = "https://medium.com/feed/@danmaccarone"
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36"
MAX_ITEMS = 6
OUT = "medium.json"


def grab(tag, s):
    m = re.search(rf"<{tag}[^>]*>(.*?)</{tag}>", s, re.S)
    if not m:
        return ""
    return re.sub(r"^<!\[CDATA\[|\]\]>$", "", m.group(1).strip())


def build(xml):
    items = re.findall(r"<item>(.*?)</item>", xml, re.S)
    out = []
    for it in items[:MAX_ITEMS]:
        title = html.unescape(grab("title", it)).strip()
        link = grab("link", it).strip()
        content = grab("content:encoded", it) or grab("description", it)
        img = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', content)
        thumb = img.group(1) if img else ""
        txt = html.unescape(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", content))).strip()
        excerpt = (txt[:155].rstrip() + "…") if len(txt) > 155 else txt
        try:
            d = parsedate_to_datetime(grab("pubDate", it))
            date, iso = d.strftime("%b %-d, %Y"), d.strftime("%Y-%m-%d")
        except Exception:
            date = iso = ""
        if title and link:
            out.append({"title": title, "link": link, "date": date,
                        "iso": iso, "excerpt": excerpt, "thumbnail": thumb})
    return out


def main():
    try:
        req = urllib.request.Request(FEED, headers={"User-Agent": UA})
        xml = urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "replace")
    except Exception as e:  # noqa: BLE001
        print(f"Fetch failed ({e}); leaving {OUT} unchanged.")
        return 0
    items = build(xml)
    if not items:
        print(f"No items parsed; leaving {OUT} unchanged.")
        return 0
    data = {"updated": datetime.date.today().isoformat(), "items": items}
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(f"Wrote {OUT} with {len(items)} items.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
