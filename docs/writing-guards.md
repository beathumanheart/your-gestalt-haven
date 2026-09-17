# Writing guards

This repository has a growing number of tests whose job is not to check that a
feature works, but to stop a specific mistake recurring: capability tokens in
the sitemap, draft copy on production, oversized images in the deploy, a
protected professional title in the markup, the whole app in one chunk.

They are worth having. Four of them were also wrong in the same way, and the
shape is worth naming.

## The rule

**A guard must be made to fail before it is trusted.** Write it, then break
the thing it guards, and watch it fail with a message that says what to do.
A guard that has only ever passed has not been tested — it has been *run*.

**Corollary: "not found" is not a pass.** If an assertion can be satisfied by
the absence of the thing it inspects, it will be — and absence is usually what
the failure looks like.

## The shape of the mistake

Each of these asserted on the **presence or absence of an artifact** rather
than on the **behaviour** the artifact was evidence of. When the guarded
regression happened, the artifact stopped existing, so the assertion passed.

### 1. Short-link URLs matched by prefix

`shortLinkIndexing.test.ts` checked that no sitemap URL *started with* `/s/`.
Real entries are language-prefixed, so a leaked room token would read
`/en/s/<slug>` and sail past. Fixed by matching path **segments**, which is
the property that actually matters: the token is a segment wherever it sits.

### 2. E2E status assertions under `vite preview`

`static-routes.spec.ts` asserted `response.status() === 200` for every
indexable route — the precise bug being that those routes had returned 404.
But `vite preview` answers **200 for every path**, real file or not, so the
assertions would have passed had the build written no files at all. The real
discriminator was the served `<head>`: an un-generated path falls back to
`index.html` and carries the English homepage's title.

### 3. `alumniOf` pinned by exact list

`structuredData.test.ts` asserted `alumniOf` names equalled exactly
`["KU Leuven", "University of Tartu"]`. Its *intent* was "ongoing training is
not claimed as completed study". Exact equality also failed when a legitimate
third institution was added, so it taught nothing about the intent and had to
be re-read to find out what it wanted. Fixed by asserting the intent directly:
the institution is absent, one entry per awarded qualification, each
identified by a resolvable url.

### 4. Chunk filenames as evidence of code splitting

`bundle-splitting.spec.ts` asserted the homepage requested no
`/assets/AdminDashboard-*.js`. Import that page eagerly — the regression — and
**the chunk does not exist at all**: its code is inlined into the entry, no
such request is made, and the guard passes. Fixed by reading the bytes the
homepage downloads and looking for strings unique to other routes, plus a size
ceiling.

## The same illusion in measurement

The pattern is not limited to assertions. Any signal that reports on a proxy
rather than the thing itself can invert:

- **A build summary is not a payload.** `manualChunks` naming the booking
  directory produced a triumphant-looking build — entry chunk down from 908 KB
  to 104 KB — while the homepage actually fetched **917 KB**, because Rollup
  moved vendor code into the named chunk and had the entry import it. The only
  honest number came from loading the page in a browser and counting bytes.
  (A second attempt, adding a `vendor` chunk, split the widget out correctly
  and still measured worse: 335 KB of JS against 276 KB for plain route
  splitting, because one vendor chunk hands the homepage dependencies only
  lazy routes use. Both dead ends are recorded so they are not retried.)
- **A local run is not a slow connection.** A 955 KB portrait looks free on a
  development machine. Measure throttled — Slow 4G, mobile viewport, median of
  several runs — or do not quote a number.
- **A reused dev server is not your build.** Playwright's `webServer` has
  `reuseExistingServer`, so a control test can run against a stale `dist` and
  report whatever the previous build did. Rebuild explicitly between controls.
- **A passing type check is not a passing runtime.** `fetchPriority` as a
  camelCase JSX prop type-checks, because `@types/react` declares it, and then
  React 18.3 does not map it and warns on every render in the browser. `tsc`
  and the browser disagreed, and only one of them was being consulted. The
  attribute is now passed lowercase through a spread; see the comment in
  `src/components/Hero.tsx`.
- **A green deploy is not a published site.** `peaceiris/actions-gh-pages`
  pushes a branch and exits. GitHub Pages then builds it, and that build can
  fail on its own — it did, twice, leaving the old social cards live for
  thirteen minutes behind two successful-looking deploys.

## When adding a guard

1. State the behaviour in one sentence. If the sentence is about a filename, a
   chunk name, or a directory listing, it is probably a proxy — find the
   behaviour underneath it.
2. Break the thing. Run the guard. Read the failure message: it should name
   the offender and say what to do next.
3. Check it cannot pass vacuously. If it iterates a set, assert the set is
   non-empty. `draftContent.test.ts` and `imageWeight.test.ts` both carry an
   explicit "scans something" assertion for this reason.
4. Prefer a self-removing exemption to a permanent one. The quarantine in
   `draftContent.test.ts` was the model: an exact path with a ceiling that may
   shrink, fails if it grows, and **fails once the file is clean**, so the
   entry cannot outlive its reason. It removed itself when the reviewed copy
   landed, which is how the exemption came to be deleted deliberately rather
   than forgotten. Copy that shape.
