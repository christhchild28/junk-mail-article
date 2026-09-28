# The Mailbox Economy

An interactive, scroll-driven essay about U.S. junk mail: what it would be "worth" if it were the whole economy, who sends it, who receives the most of it, what it costs the environment, and how to opt out.

## Run locally

It's a static site with no build step. Serve the folder with any static server:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

Opening `index.html` straight from disk also works in most browsers. A local server matches production more closely.

## Deploy

GitHub Pages: **Settings → Pages → Deploy from a branch → `main` / root**.

Live at **https://christhchild28.github.io/junk-mail-article/**. Visits and reader events (mailbox opened, "Start reading", chart toggles, opt-out link clicks) are counted with [GoatCounter](https://www.goatcounter.com); see `js/analytics.js`.

## Structure

```
index.html            markup and article copy
css/styles.css        all styles (light/dark tokens at the top)
js/article.js         counters, Matter.js mail piles, scene reveals
js/hero.js            mailbox hero: mail storm and stacked stat cards
js/treemap.js         USPS sender treemap ("Can you stop it?")
js/mailstream.js      <junk-mail-flow variant="income|age"> ribbon chart and view toggle
js/laser.js           opt-out section animation
js/analytics.js       GoatCounter reader events
vendor/matter.min.js  Matter.js 0.19.0 (MIT) for pile physics
```

Every animation runs only while it's on screen. The piles stop once their envelopes settle. All motion respects `prefers-reduced-motion`.

## Sources

- USPS Household Diary Study, FY 2024 (Tables 5.1 and A-11)
- USPS Household Mail Survey, FY 2025 (age breakdown)
- ForestEthics / Environmental Defense Fund (2008), junk mail lifecycle
- McAfee / ICF, "The Carbon Footprint of Email Spam" (2009)

The page footer lists the figures used for the estimates.

## Credits

Physics by [Matter.js](https://brm.io/matter-js/) (MIT License).
