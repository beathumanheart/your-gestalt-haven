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

`src/__tests__/imageWeight.test.ts` holds shipped images to 200 KB and does
not scan this directory. If an image here is ever needed on a page, export a
web-sized version into `src/assets/` rather than importing the master.
