# GitHub Pages deploy notes

IZAKAYA Verse is published as a GitHub Pages project site:

```text
https://motookoyama.github.io/IZAKAYA_verse1.5/
```

Because the site is served under `/IZAKAYA_verse1.5/`, a normal `npm run build` is not enough for release. The normal build writes `/assets/...` references for local preview and will break when uploaded to the project subpath.

## Preflight

```sh
npm run build:pages:dry
```

Confirm `output/github-pages-dry-run/index.html` contains asset paths beginning with:

```text
/IZAKAYA_verse1.5/assets/
```

Then preview the dry-run output locally with a static server and open:

```text
http://127.0.0.1:1398/IZAKAYA_verse1.5/
http://127.0.0.1:1398/IZAKAYA_verse1.5/#/regions
http://127.0.0.1:1398/IZAKAYA_verse1.5/#/region/metatuber-region
http://127.0.0.1:1398/IZAKAYA_verse1.5/#/region-guide
```

## Release build

Only after preflight passes:

```sh
npm run build:pages
```

This writes the static app into `docs/` while preserving markdown release notes under `docs/`.

## Upload gate

Before pushing, check:

- `docs/index.html` uses `/IZAKAYA_verse1.5/assets/...`.
- Region pages open under the `/IZAKAYA_verse1.5/` base path.
- Catalog/V2 card UI still opens on the local preview server.
- No X posting or API work is mixed into the deploy operation.

If `docs/index.html` contains `/assets/...` without `/IZAKAYA_verse1.5/`, stop and rebuild with `npm run build:pages`.
