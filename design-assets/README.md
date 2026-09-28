# design-assets

Masters and source material. **Nothing here ships.**

Vite only emits files from `src/assets/` when something imports them, and
copies `public/` verbatim. This directory is neither, so files here stay in
the repository and out of every deploy.

That distinction is the point. `og-image.png` sat in `public/` at 2.1 MB,
referenced by nothing, and was copied into every deploy for months because
`public/` ships whether or not anything points at a file.

| File | What it is |
|---|---|
| `portrait-original.jpeg` | 1440×1920 master. `src/assets/portrait-640.*` is cropped from it — see the comment in `About.tsx` for the crop and why it is deliberate. |
| `og-image-original.png` | The 2.1 MB original of the social card. Highest-resolution copy that exists; no copy was found outside the repository. Keep until it is backed up elsewhere. |
| `inspiration.heic` | Reference image, never imported. |
| `automatic-yes/` | The worksheet handoff: the prototype the page was built from, and the Python that generates its wording and PDF. |
| `homepage-compaction/` | The handoff for the services restructure, the EN·RU toggle and the footer socials. **Partly superseded**: it specifies Substack and Instagram icons, which were deliberately removed afterwards — see the note on `SAME_AS` in `src/config/social.ts`. Kept for the prototypes, which are still worth diffing against. |
| `feelings-map/` | The prototype the feelings map was built from. |

Handoff bundles arrive mirroring the repository, so they carry copies of
files that already exist here. Those copies are dropped when the bundle is
filed — `homepage-compaction` shipped a byte-identical `portrait.jpeg` and
`hero-therapy.jpg`, 1.1 MB of duplicate — and only the prototypes and the
brief are kept.

`src/__tests__/imageWeight.test.ts` holds shipped images to 200 KB and does
not scan this directory. If an image here is ever needed on a page, export a
web-sized version into `src/assets/` rather than importing the master.
