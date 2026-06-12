# Design spec: showing the studs

A bare-bones version of thcostello.com, for evaluation against the editorial design. Status: **implemented 2026-06-12** (Option B; Puck kept; muted link color; single-column likes; copy carried over nearly whole, trimmed only for same-page repetition). The original mock-up is at `design/studs-mock.html`.

## Premise

Polish used to be evidence of effort. Now an LLM produces considered typography, hairline rules, and a tasteful dark mode on request, so polish has stopped carrying information — and may carry the wrong information. The costly signal inverts: a site that looks typed rather than designed says *a person wrote this, and what they cared about was the content.* The reference class is the unstyled-on-purpose academic page (Dan Luu, Peter Norvig, half the senior faculty pages worth reading), not "brutalist web design," which is itself now a polished aesthetic. The defense against that irony is to be genuinely utilitarian rather than performatively plain: every rule in the stylesheet must earn its place as a legibility fix, never as a look.

## Principles

1. **Default is the design.** Browser defaults are overridden only where they actively hurt reading or date the page: the typeface is Georgia (a screen-native serif shipped with every OS since the late 1990s — zero downloads), headings are normal weight, lists carry no markers, and links are one muted color. Nothing else is styled.
2. **The page is the source.** Semantic HTML you could read in `view-source` or Lynx and lose nothing. No wrapper divs without a job, no class names where an element will do.
3. **Zero dependencies.** No webfonts, no Google requests, no JavaScript on the main pages, CSS inlined in each page's `<head>` (it's small enough). A page is one HTTP request plus its images.
4. **No furniture.** No theme toggle (one line of CSS gives the OS dark mode for free), no scroll animations, no view transitions, no hover effects, no ornaments, no fleurons, no section numerals.
5. **Facts carry over exactly; copy may be condensed.** The current copy already passed the voice test, so condensation means cutting sentences, never rewriting them in a new register.

## The entire stylesheet

This is the whole stylesheet, inlined in each page:

```css
html { color-scheme: light dark; }
body {
  max-width: 60rem;
  margin: 2.5rem auto;
  padding: 0 1rem;
  line-height: 1.5;
  font-family: Georgia, serif;
}
h1, h2 { line-height: 1.2; font-weight: normal; }
img { max-width: 100%; height: auto; }
hr { border: none; border-top: 1px solid; margin: 2.5rem 0; }
a { color: light-dark(#3d5a73, #9fbcd4); }
ul { list-style: none; padding-left: 0; }
li { margin-bottom: 0.8rem; }
```

Eighteen declarations in eight rules (revised per owner feedback: wider measure, Georgia instead of the browser default, normal-weight headings, no list markers, one muted link color). `color-scheme: light dark` makes the browser itself render dark mode — background, text, and the default link colors all invert correctly with no custom palette, no toggle, no stored preference. Two caveats: the blue/purple defaults are the light-mode rendering (dark mode gets the browser's scheme-aware equivalents), and visitors who chose dark via the current site's toggle lose that stored preference — dark now follows the OS setting only. The measure and line-height are legibility, not style. Everything else is whatever the browser ships.

## Structure

Two options; B is recommended.

**Option A — keep the seven pages, restyled plain.** Lowest-risk; URLs unchanged; each page becomes default-styled HTML. The masthead becomes one line of links. Downside: seven plain pages feel thinner than one dense one, and the nav itself is furniture.

**Option B — collapse to three pages (recommended).** Structural honesty is part of the signal: no more pages than the content needs.

- `index.html` — everything: name, short bio, selected work, the lab (idea in one paragraph, people, joining), teaching, three lines of media + CV pointer, contact. Sections separated by `<hr>`. One screen of links at top is unnecessary — the page is short enough to scroll.
- `research.html` — the complete publication list, working papers, chapters, popular press. (It is genuinely long; folding it into index would bury the bio.)
- `likes.html` — as is, restyled plain.
- `future.html`, `conspiracy.html`, `rain.html`, `thanks.html` — untouched. The easter eggs were never polished; they already fit.
- Old URLs (`about.html`, `lab.html`, `media.html`, `contact.html`) remain as five-line stub pages with a meta-refresh, a `rel="canonical"` to the target, and a plain link to the right anchor (`index.html#lab`, `#media`, `#contact`), so nothing inbound breaks.

## Page anatomy (index)

```
Thomas H. Costello
Assistant Professor, Social and Decision Sciences, Carnegie Mellon University
[email] · [Google Scholar] · [CV (pdf)] · [complete publications] · [likes]
----------------------------------------------------------------------
3–5 sentence bio (condensed from the current About opening)
one photo, plain <img>, no treatment, no frame
----------------------------------------------------------------------
Selected work          (h2)
plain <ul>: title (linked) — venue, year. one line each, no descriptions
or keep the current 1–2 sentence descriptions — open question below
----------------------------------------------------------------------
Viewpoints Lab         (h2)
the Approach paragraph, condensed · people as a plain list · joining in 2 lines
----------------------------------------------------------------------
Teaching / Media       (h2, short)
courses as plain lines · "Coverage: NYT, Economist, FT… Full record in the CV."
----------------------------------------------------------------------
Contact                (h2)
email, office, profiles as a plain list
----------------------------------------------------------------------
Last updated June 2026.
```

## What survives, what goes

| Survives | Goes |
|---|---|
| All copy (condensed, never rewritten) | css/main.css, variables.css, animations.css (~1,400 lines → 11 declarations) |
| All facts, links, DOIs | js/main.js entirely (no toggle, no reveals, nothing left for it to do) |
| Meta/OG/canonical tags, sitemap | Google Fonts (two fewer third-party requests) |
| Easter-egg pages, untouched | View Transitions, settle animations, duotone hovers |
| Accessibility (semantic HTML is most of it) | Masthead, footer colophon, section numerals, marginalia |

**The Puck question.** Puck is the one thing on the current site no LLM would default to — a deranged Win95 jester is a stronger humanity signal than any typography. He is also ~100KB of JS/CSS on a site whose entire philosophy is now "one request." Recommendation: **keep him**, as the single deliberate exception — default HTML plus a purple jester is an unmistakably human combination, and the contrast does work that neither does alone. But he is the first thing to cut if the purity matters more to you.

## Photos

Professional headshots are polish; in this design they read as PR. Candid phone photos presented as plain `<img>` tags — no duotone, no frames, no captions in small caps — fit the register exactly. When you add new photos, prefer the casual ones; one on index, a few on the likes page or nowhere. (The pro shoot stays in the repo for talks/press kits regardless.)

## Acceptance criteria

- Each main page is a single HTML file: zero JS, zero external CSS, zero font requests — Puck's two files (puck.css, puck.js) being the one sanctioned exception if he stays.
- Each page keeps the viewport meta tag, canonical URL, OG/Twitter tags, and a favicon (the ❧ data-URI costs no request; dropping it 404s /favicon.ico on every load).
- index.html under 30KB before images.
- Readable in Lynx / with CSS disabled — try it; nothing should be lost but the margins.
- Dark mode works via OS preference with no site code beyond `color-scheme`.
- Lighthouse performance 100 with no optimization work.

## Risks

1. **Plain can read as abandoned.** The mitigation is freshness, not decoration: the "Last updated" line, current paper statuses, a working CV link.
2. **Deliberate artlessness is itself becoming a known style.** True. The defense is that this version is cheaper to maintain, faster, and more durable on every dimension — it is better even if nobody reads the signal.
3. **Some audiences expect a designed site** (deans, program officers, journalists skimming before an interview). The content density and the CV link serve them; whether the absence of design costs anything with them is a judgment call only you can make.
4. **It discards sunk work** — the editorial design stays in git history forever; switching back is one revert.

## Migration, if you choose it

Half a day: write the three pages (content is copy-paste from the current ones), add the four stub redirects, update sitemap, delete the dead CSS/JS, keep Puck's files, verify in Lynx and a browser, commit. The editorial version remains one `git revert` away.

## Open questions for Tom

1. Option A (seven plain pages) or B (collapse to three)?
2. Puck: stays or goes?
3. Selected-work entries: bare one-liners (title — venue, year) or keep the current short descriptions? (Honors stay embedded in research.html prose either way — the one-liners stay unannotated so each honor appears once.)
4. Default blue/purple links, or one step softer (a single muted link color — the only custom color on the site)?
5. Does the likes page keep its two columns (a `columns: 2` one-liner) or run as one long list?
