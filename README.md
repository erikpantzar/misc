# misc

Grab bag of one-off static pages, served via GitHub Pages.

Each page lives in its own folder as `index.html`, so it gets a clean URL:

| Page | URL |
| --- | --- |
| Octane Racing 2.0 — #general-chat stage report | https://erikpantzar.github.io/misc/octane-chat-report |

Pages here are set to `noindex, nofollow` and the repo root carries a
blanket-disallow `robots.txt` — the URLs work when shared, but search
engines are asked to stay out.

## Adding a page

```sh
mkdir my-page
cp /path/to/thing.html my-page/index.html
git add my-page && git commit -m "add my-page" && git push
```

Live at `https://erikpantzar.github.io/misc/my-page` a minute or two later.
