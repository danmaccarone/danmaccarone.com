# danmaccarone.com

A coded version of Dan Maccarone's site, built from the Figma design.
Static single-page site — no build step, no dependencies.

```
index.html          # all markup, sections in Figma order
css/styles.css      # styles; design tokens in :root at the top
js/medium-feed.js   # live Medium feed for the Writing section
js/main.js          # mobile nav + footer year
images/
  headshot.svg      # placeholder (see "Headshot" below)
  favicon.svg
```

## Sections (matches the Figma order)
Hero → Bio ("Business & UX Strategist") → Charming Robot → The Barstool MBA →
Story in a Bottle → **Dan on Medium (Writing)** → Speaking Engagements →
In the News → Footer.

## Headshot
Every photo of Dan points at `images/headshot.jpg` with an SVG placeholder
fallback. Drop your photo in there and it appears in the hero and the Bio
avatar. A grayscale + contrast CSS filter renders it black-and-white to match
the design.

## Medium / Writing feed
The Writing section pulls Dan's latest Medium posts **live, in the visitor's
browser**, from `medium.com/feed/@danmaccarone` (via an RSS→JSON bridge, with a
fallback to AllOrigins and then a plain "read on Medium" link). No API key, no
build step. It won't render in a sandbox that blocks medium.com, but works for
real visitors.

## Still to drop in (from the work archive)
The Figma uses placeholder (Lorem ipsum) body copy, so real copy + assets come
from the work archive (files.instinct.com). Search the HTML for `TODO` to find:
- Bio, Charming Robot, Barstool MBA, Story in a Bottle body copy
- Real Story in a Bottle latest-episode data
- Speaking engagements (upcoming + past)
- In the News press items
- Real design assets (robot logo, book cover, episode art, feature photos) —
  the logos are currently clean SVG stand-ins.

## Run locally
```bash
python3 -m http.server 8000   # then open http://localhost:8000
```
