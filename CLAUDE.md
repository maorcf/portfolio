# Maor's portfolio — context for Claude

Maor Cohen Falah, UX/UI + graphic designer, recently graduated, looking for a first role. This repo is his portfolio site, **maorcohenfalah.com**. Maor writes in Hebrew; answer in Hebrew, keep code/commit messages in English. Use they/them or just "Maor" in English text.

## Site setup
- Static HTML/CSS/JS, no framework, no build step. Repo `github.com/maorcf/portfolio`, branch `main`.
- Hosting: Vercel (project "portfolio", team "MCF"). **Every push to `main` deploys live** within ~30s. The domain redirects to `www.maorcohenfalah.com` (308).
- Domain bought on Namecheap, DNS → Vercel (GitHub Pages was abandoned).
- Pages: `index.html`, `about.html`, `playground.html`, `work-chido.html`, `work-pazi.html`, `work-filmroll.html`, `work-austrip.html`, `work-fireline.html`, plus `fireline-game.html`, `playground-hand-particles.html`, and `showreel*/`. All main pages share `style.css` and `script.js`.
- **Cache-busting (load-bearing):** after any `style.css` / `script.js` edit, bump `?v=N` on every HTML file (`sed -i '' 's/style\.css?v=OLD/style.css?v=NEW/g' *.html`). Current: `style.css?v=207`, `script.js?v=110`.
- Look: cream paper `--cream:#F3EFE4`, ink outlines, neo-brutalist cards, accents violet `#5B4CE0` / lime `#D3F26A` / yellow / rose, Inter font. Hero sits in a lavender frame (`--frame-bg:#C9C2ED`).
- Maor is preparing the portfolio for **McCann** (ad agency): lead with advertising/graphic-design work (Playground order starts with New Balance posters, Space posters, Wine label).

## Projects on the site
- **Work:** Chido (kiosk), Pazi (AI app), FilmRoll (wedding camera, built in Base44), Austrip (travel site), **Fireline** (game, see below). Never include DonateApp/Dona anywhere.
- **Fireline** (added Oct 2026): `work-fireline.html` is the case study, `fireline-game.html` is the playable game. The game is a **copy** of a claude.ai artifact (`8e9af07d-748d-43bd-b693-2cd23a8e166d`, also `claude.ai/artifact/JcMNA8sX3FPZU6kUm8z4kk`) — it does not auto-update. When Maor sends that link and says "update", re-copy it: strip the body `<title>Fireline</title>`, put `<title>Fireline | Maor Cohen Falah</title>` + description + favicon in `<head>`, write `fireline-game.html`, push. If levels/mechanics changed, update the case-study text and screenshots too. Facts Maor wants stated: ~3-hour project, his first game made with AI, Claude connected to Higgsfield and other plugins, look designed in Figma, the idea was his own (a light, simple, addictive game). 8 playable levels.
- **Homepage liquid hero** (Oct 2026): `hero-liquid.js` (homepage only, loaded before `script.js`) — WebGL2 fluid sim shaded as glossy slime that refracts and inflates the headline. It came from Maor's claude.ai sketch artifact `claude.ai/artifact/MJvaJxUDDXfD9moN8cjQm4`. While its canvas exists, the dot-trail effect in `script.js` is skipped; without WebGL2 the old hero shows.
- **Pazi** case study has a custom full-screen hero. If Maor says **"mango" (מנגו)**: `git checkout 7d3a09d -- work-pazi.html`, bump versions, commit, push, no questions.
- **Playground rule:** every new Playground project must also go into the homepage carousel `.playground-strip-track` in `index.html` — in BOTH the real set and the `aria-hidden` duplicate set, with an `id` on the Playground card and a ~700px strip thumbnail (`playground-thumb-*.jpg`, aspect ~1.4).

## Showreel (branch `showreel`, not merged into main)
Standalone ~26s reel for recruiters at `/showreel/`, NOT a homepage intro. v1 `/showreel/` calm editorial, v2 `/showreel2/` dark 3D promo, **v3 `/showreel3/` is the approved one** (120 BPM, pre-rendered `soundtrack.m4a`, Figma-tutorial-style pop music). Order: name + lime "UX/UI Designer" pill → FilmRoll → Chido → Pazi → Austrip → end card. No Ondo, no DonateApp, no "design language" fragment section, no hit sounds on popping words, soft transitions, never the phrase "Messy problems". URL params `?clean`, `?t=12`, `?paused`; `window.reel.seek(t)` for exact frames. After any `score.js` change the soundtrack must be re-rendered to `soundtrack.m4a` and its `?v=` bumped. Keep every version when trying a new one.

## Open experiments (not on the site)
- **Typographic hero redesign** (Oct 2026): explored editorial hero options locally; the last direction Maor liked was a centered Didone serif (Bodoni Moda) lowercase "maor." with an italic violet "Hi, I'm", a tilted violet "PORTFOLIO 2026" stamp with a star, "UX/UI + Graphic Designer" under it, no grain texture, lots of white space. Preview only, never applied.

## How Maor likes to work
- Spend tokens sparingly; verify in proportion to risk (no screenshot loop for trivial CSS).
- "Just check how it looks" = build a separate preview, don't touch the site. "Put it on the site" = commit to `main` and push.
- Images he pastes in chat can't be read as files — ask him to save them to `~/Desktop/תיק עבודות` and find them by recent mtime.
- When a changed image keeps showing old bytes, give it a new filename instead of cache-busting the same name.
- Image sizes: detail images ~1000–1200px wide at JPEG quality 75–80; carousel thumbs ~700px; keep pages light.
- Don't add `will-change` or `loading="lazy"` to the homepage carousel images (both broke mobile). Avoid `box-shadow` on continuously animated elements.
- CSS overrides must come AFTER the base rule they override (source order bit us 3+ times).
- Opacity+visibility fades need `transition: opacity .5s, visibility 0s linear .5s` on the hidden state.
- Preview tooling notes: the browser pane is often hidden, so rAF animations stall there; headless Chrome via a DevTools-protocol script works for screenshots (plain `--screenshot` hangs on WebGL pages).
