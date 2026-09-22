# Brief: "The automatic yes" — a worksheet page on /take, with Brevo sign-up

For Claude Code, working in this repository. Read `CLAUDE.md` first; everything
there still applies. Work on a feature branch (`feat/take-automatic-yes`), and
stop for review before anything is pushed.

## What this is

A free worksheet on people-pleasing, companion to a long-form YouTube video.
It already exists as a 10-page PDF. This adds it to the "Take with you" shelf
as its own page, where a reader can fill it in on screen, and adds an optional
email form: the PDF by email, and the monthly letter by double opt-in. Brevo
sends both and holds the letter's list. The letter is moving off Substack onto
this site's own list.

Two milestones. **Milestone 1** (the page) ships on its own, with the sign-up
switched off. **Milestone 2** (Brevo) switches it on, once the Brevo IDs exist
and the privacy notice is published.

## Files in this handoff

| Path | What it is |
|---|---|
| `src/content/automaticYes.ts` | Every string on the page, typed. Use as is — do not reword. |
| `public/downloads/the-automatic-yes-human-heart.pdf` | The PDF (A4, 10 pages, ~270 KB). |
| `design-assets/automatic-yes/web-prototype.html` | Visual spec. Open it in a browser. Fonts are inlined only so it previews alone. |
| `design-assets/automatic-yes/source/` | The generator the PDF and the content file came from. Nothing here ships. |
| `docs/briefs/brevo-setup.md` | Genia's manual steps in Brevo. Not code. |

## Decisions already made — do not reopen

1. **No logo mark on the page other than the site's own heart.** (An earlier
   design had a chair; it is gone everywhere.)
2. **English only.** `/ru/take/automatic-yes` redirects to the English page;
   the Russian shelf does not list it; the build generates the route for `en`
   alone, and its head claims no Russian alternate.
3. **The worksheet writes nothing to the device by default.** `/take/*` is
   built on that footing (see `src/config/analytics.ts`), and the answers here
   can be as personal as the booking enquiry. Answers live in React state. Only when
   the reader switches on *Keep my answers on this device* are they written to
   `localStorage` (one key, `hh-automatic-yes-v1`); switching it off deletes
   the key.
4. **Answers never leave the browser.** No request carries them. No PostHog
   call is added: on `/take/*` PostHog counts page opens and nothing else, and
   that stays true. The worksheet's root element still carries `ph-no-capture`
   (class) and `data-ph-no-capture` (attribute), the same belt-and-braces as the
   booking enquiry, with a test that pins it.
5. **Email goes through Brevo**, which the booking function already uses:
   a transactional email with the PDF link, a double opt-in for the letter,
   and the monthly campaigns (sent by hand from Brevo — no code).
6. **The letter is a separate, unticked checkbox.** The PDF email goes out
   either way; the letter list only receives an address after the reader
   confirms from Brevo's double opt-in email.
7. **The PDF is linked only from the email.** It lives in
   `public/downloads/`; `robots.txt` disallows `/downloads/`.

---

## Milestone 1 — the page

### 1. Content and the shelf card

- Add `src/content/automaticYes.ts` from the handoff unchanged.
- `src/content/take.ts`: add to `takeEN.items`, directly after `feelings-map`
  (live items first):

  ```ts
  {
    slug: "automatic-yes",
    status: "live",
    kind: "Worksheet",
    title: "The automatic yes",
    description: "Five short parts, for the yes that arrives before you do.",
  },
  ```

  Leave `takeRU` as it is.
- Add `public/downloads/the-automatic-yes-human-heart.pdf` from the handoff.
- `public/robots.txt`: `Disallow: /downloads/`, with a one-line comment — the
  PDF is reached from the email, not from search.

### 2. Head text and the static route (English only)

`src/config/pageMetadata.ts`:

```ts
export const AUTOMATIC_YES_TEXT: RouteText = {
  titleEn: "The automatic yes — a worksheet on people-pleasing | Human Heart",
  descriptionEn:
    "A free worksheet on people-pleasing through Ferenczi, Winnicott and Gestalt: catch one yes, trace where it began, and try one small experiment.",
  // English-only route (see `langs` below): the RU fields are never rendered.
  titleRu: "The automatic yes — a worksheet on people-pleasing | Human Heart",
  descriptionRu:
    "A free worksheet on people-pleasing through Ferenczi, Winnicott and Gestalt: catch one yes, trace where it began, and try one small experiment.",
};
```

Give `StaticRoute` an optional `langs?: readonly MetaLang[]` (absent = `LANGS`),
and add:

```ts
{ path: "/take/automatic-yes", priority: "0.7", changefreq: "monthly", langs: ["en"], ...AUTOMATIC_YES_TEXT },
```

Then make the build honour it — today every route is assumed bilingual:

- `scripts/static-site/plugin.ts`: carry `langs` on the generated route (keep
  it out of `text` when `collectRoutes` spreads the rest), then iterate
  `route.langs ?? LANGS` when writing files, when building prerender targets,
  and in `assertNoForbiddenPaths`; fix the logged URL count.
- `scripts/static-site/render.ts`: for a single-language route,
  `alternateLinks` emits the self link and `x-default` (pointing at itself)
  only, `og:locale:alternate` is left out, and `renderSitemap` writes one
  `<url>` whose alternates are self + `x-default`.
- `src/components/PageMeta.tsx`: add the same option (a `langs` prop), so the
  runtime head matches the generated file: no link to a Russian page that
  does not exist, `x-default` at itself.

Expected result: `dist/en/take/automatic-yes.html` exists with its own head and
a prerendered body; `dist/ru/take/automatic-yes.html` does not; the sitemap has
one entry for it.

### 3. Route and page

- `src/App.tsx`: a lazy `TakeAutomaticYes` page on `/:lang/take/automatic-yes`,
  inside `LangLayout`, placed **before** `/:lang/take/:slug` (which would
  otherwise render the "not written yet" placeholder).
- `src/pages/TakeAutomaticYes.tsx`: if the language is `ru`, render
  `<Navigate to="/en/take/automatic-yes" replace />`. Otherwise:
  `<PageMeta {...AUTOMATIC_YES_TEXT} canonicalPath="/en/take/automatic-yes" langs={["en"]} />`,
  the page's font link (below), `<Header />`, `<main className="min-h-screen bg-background pt-24 md:pt-28">`
  with the worksheet, `<Footer />` — the same frame as `Feelings.tsx`.
- Components under `src/components/automatic-yes/`. A reasonable split, not a
  requirement: `AutomaticYes.tsx` (layout and sections), `WorksheetBlock.tsx`
  (renders one `WorksheetBlock` by `kind`), `Pills.tsx`, `BodyMap.tsx`,
  `useWorksheetAnswers.ts` (state + the keep switch), `SignupCard.tsx`,
  `LetterForm.tsx`, and a scoped `STYLES` string as `TakeIndex.tsx` does.

### 4. Page anatomy (top to bottom — match the prototype)

1. Breadcrumb: `crumb` → `langPath("/take")`, then `· crumbHere`.
2. Confirmation banner (`confirmed`), shown only when the URL has
   `?letter=confirmed` — Brevo returns readers there after they confirm.
3. Hero: a peach card (the YouTube thumbnail's colour). Kicker, the title as
   three lines with the middle word in italic (`hero.title`), subtitle, meta.
   Right column: the sign-up card. **While sign-up is off, the card is not
   rendered and the hero is one column.**
4. The on-page note (`onPage`) in a sage panel, with the keep switch
   (`keepLabel`, `keepHelp`).
5. *Before you begin*: kicker, title, paragraphs, the four how-to rows, then
   *Three lenses, one lineage* — three cards linking to `#ferenczi`,
   `#winnicott`, `#introjection`.
6. Parts one to four — one `<section id={part.id}>` each: kicker, title, the
   quote (if any: terracotta left rule, Cormorant italic, attribution in small
   caps), lead paragraphs, then the numbered blocks.
7. The turn: an olive card, centred — mark, Beisser's quote, attribution, a
   short rule, two paragraphs (the second in Fraunces italic).
8. Part five (`pause`): the three moves with large terracotta numerals, their
   options and fields; *A small experiment* in a sage panel; the care note.
9. *Afterwards*: its blocks, then *What stays with you* in a warm panel.
10. A bar: *Print or save as PDF*, *Clear my answers*, and the save status
    (`savedOn` / `savedOff`).
11. The letter block (warm panel). **Not rendered while sign-up is off.**
12. Closing: a peach card — Winnicott's quote, the portrait (reuse
    `src/assets/portrait-640.{webp,jpg}` exactly as `About.tsx` does), name,
    role, the sessions line, and two buttons: *Book a Session* (the same
    target as the header's button, `langPath("/#contact")`, **without** its
    analytics call) and *Watch on YouTube* (`SOCIAL_URLS.youtube` from
    `src/config/social.ts` — never a hardcoded URL).
13. Sources in `<details>`, then the fine print.

### 5. Blocks and behaviour

| `kind` | Renders as |
|---|---|
| `text` | Label + auto-growing `<textarea>` (`rows` = starting height). |
| `choice` | `<fieldset>` + `<legend>`; options as pills that are real `<input type="checkbox">` (or `radio` when `single`) inside `<label>`; `other: true` adds a pill holding a text input — typing into it ticks it. |
| `body` | Textarea beside the body outline (below it on mobile). Tapping the outline adds a dot; tapping a dot removes it. The textarea is the keyboard route; the SVG has `role="img"` and `aria-label={figureLabel}`. |
| `pair` | Two labelled textareas side by side (stacked on mobile). |
| `form` | Rows of label + hint + textarea (the caretaker's job description). |
| `moments` | `count` rows: a text input + a radio group of `choices`. |
| `chew` | Italic sub-questions, each with its own textarea. |
| `example` | Italic line with a sage left rule. No input. |

The body outline path (viewBox `0 0 150 230`, fill `#EFE7DC`, stroke `#CDBFAE`):

```
M75 8c-14 0-24 12-24 29 0 14 7 25 16 29v12c-2 5-12 8-26 12-18 5-28 16-29 34l-2 106h130l-2-106c-1-18-11-29-29-34-14-4-24-7-26-12V66c9-4 16-15 16-29 0-17-10-29-24-29z
```

Dots: `r=6`, fill `#D17147` at 0.85 opacity, `1.5` cream stroke, stored as
`[x, y]` pairs in viewBox units.

**Answers.** One object keyed by field `id` (sub-fields as `${id}-${index}`,
the body map as `body-dots`). The keep switch is `role="switch"`, off by
default. On → write the whole object to `localStorage["hh-automatic-yes-v1"]`
and keep writing on every change. Off → remove the key. On load, if the key
exists, restore it and show the switch on. Every `localStorage` access in
`try/catch` — private windows throw.

**Clear**: first tap turns the label into `clearConfirm` for 4 seconds; a
second tap inside that window empties the answers (and the key, if kept).

**Print**: `window.print()`. Print CSS for this page hides the site header and
footer, the sign-up card, the on-page note, the button bar, the letter block,
the closing buttons and the sources; starts each part on a new page; prints
fields as ruled lines carrying the reader's text.

### 6. Visual spec

The prototype is the reference. Where it and an existing site component
disagree, the site wins. Tokens, all already in use on `/take`:

| Token | Hex | Used for |
|---|---|---|
| background / card | `#FAF8F5` | page, sign-up card, fields |
| heading | `#464039` | titles |
| body | `#5c554e` | text |
| muted | `#8A8075` | hints, attributions |
| kicker | `#C2603A` | kickers, numerals, quote rule |
| accent | `#D17147` | ticked pills, body-map dots |
| sage | `#437059` | links, buttons, focus |
| sage dark / panel / line | `#3c5c4c` / `#E9F0EC` / `#D7E3DC` | on-page note, experiment box |
| warm panel / border | `#F3EFE8` / `#E7E1DA` | panels, field borders |
| peach / ink | `#D8A98B` / `#211811` | hero and closing cards |
| olive / cream / tan | `#232A21` / `#EFEBE1` / `#C4A78C` | the turn |

Type: Fraunces for the hero title (weight 600, `'opsz' 144, 'SOFT' 0, 'WONK' 0`,
middle word italic), section titles (~420, opsz 72) and small headings
(~520, opsz 36); Lora for everything else (already global); Cormorant Garamond
italic 500 for quotes. The global import has Cormorant italic only at 300/400,
so the page loads its own link, via Helmet as `TakeIndex.tsx` does:

```
https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,500&family=Fraunces:ital,opsz,wght,SOFT,WONK@0,9..144,300..700,0..100,0..1;1,9..144,300..700,0..100,0..1&display=swap
```

Check that it returns CSS (Google answers a malformed axis list with a 400).
If it does not, drop `SOFT,WONK` from the request and the settings.

Layout: container as `.tk-root` (max 980 px); text column max 720 px; hero and
closing cards radius 20 px; panels radius 16 px; pills and buttons fully
rounded, buttons as `.btn-primary`. Hero collapses to one column under 760 px.
Honour `prefers-reduced-motion`.

### 7. Tests for Milestone 1

Write each guard so it fails first (see `docs/writing-guards.md`).

- `src/__tests__/automaticYes.test.tsx`
  - every `textbox` on the page has an accessible name (query by role and name,
    as `formLabels.test.tsx` does);
  - the worksheet root has the `ph-no-capture` class and the
    `data-ph-no-capture` attribute (asserted on the rendered element, as
    `analyticsPrivacy.test.tsx` does);
  - typing with the switch off never writes `hh-automatic-yes-v1` (spy on
    `localStorage.setItem` and check the key — `LangLayout` legitimately writes
    `lang`); switching on writes it; switching off removes it; a stored key is
    restored on mount;
  - `/ru/take/automatic-yes` redirects to `/en/take/automatic-yes`.
- `src/__tests__/staticSite.test.ts`: loops over `route.langs ?? LANGS`; the
  sitemap count is the sum of each route's languages; new cases — an
  English-only route has no Russian alternate, `x-default` points at itself,
  and the sitemap carries one `<url>` for it.
- `e2e/static-routes.spec.ts`: `/en/take/automatic-yes` is served with its own
  `<title>` (assert on the served head, not on status — see the note in
  `docs/writing-guards.md`), and `/ru/take/automatic-yes` is not a generated
  file.
- Then the whole suite: `npm run test`, `npm run build` (the prerender step
  fails on an empty render, which is the point), `npm run test:e2e`.
  `bannedTerminology.test.ts` and `draftContent.test.ts` scan the new files too.

### Milestone 1 is done when

- [ ] `/en/take/automatic-yes` renders the full worksheet, matching the prototype, with sign-up off.
- [ ] The shelf (`/en/take`) shows the card, live, after the feelings map.
- [ ] `/ru/take/automatic-yes` lands on the English page; the RU shelf is unchanged.
- [ ] The worksheet writes nothing to `localStorage` until the switch is turned on.
- [ ] No new PostHog calls; the no-capture markers are pinned by a test.
- [ ] Print gives the worksheet with the reader's answers and no site chrome.
- [ ] The generated file, head and sitemap are English-only for this route.
- [ ] All tests and the build pass.

---

## Milestone 2 — email through Brevo

Prerequisites (Genia): the steps in `docs/briefs/brevo-setup.md`, and a
published privacy notice at `/en/privacy` — the sign-up small print links to
it. **Do not switch sign-up on before both exist.**

### 1. Edge Function `take-signup`

`supabase/functions/take-signup/index.ts`, modelled on `process-booking`
(same CORS headers and preflight, same JSON logging with a `requestId`, same
error shape `{ error: { code, message, requestId } }`).

- `supabase/config.toml`: `[functions.take-signup]` with `verify_jwt = false`,
  as for `process-booking`.
- `.github/workflows/deploy-production.yml`: deploy it alongside
  `process-booking`.
- Share, don't copy: move `sendEmail`, `shell`, `button`, `escapeHtml`,
  `TRANSACTIONAL_HEADERS` and `BrevoMessage` into `supabase/functions/_shared/`
  and import them in both functions. The booking emails must come out
  byte-identical — `bookingEmails.test.ts` is the check.

**Request** (`POST`, JSON):

```json
{ "email": "reader@example.com", "pdf": true, "letter": false,
  "source": "automatic-yes", "lang": "en", "company": "" }
```

`company` is a honeypot, rendered off-screen in both forms. If it has any
value, answer `200 { ok: true }` and do nothing.

**Checks**, in order: trimmed email, at most 254 characters, a plausible
address; `source` is a key of a server-side map (so the PDF URL is never taken
from the client):

```ts
const SOURCES = {
  "automatic-yes": {
    pdfPath: "/downloads/the-automatic-yes-human-heart.pdf",
    pagePath: "/en/take/automatic-yes",
  },
} as const;
```

At least one of `pdf` / `letter` is true; `lang` is `en` or `ru` (default
`en`). Failures: `400 VALIDATION_FAILED`.

**Rate limit**: the existing `check_rate_limit` RPC with the hashed client key,
bucket `take-signup:<hash>`, 5 per 600 seconds → `429 RATE_LIMITED`.

**PDF** (when `pdf`): a transactional email built in
`take-signup/lib/emails.ts` (`buildWorksheetEmail`) with both HTML and plain
text, `TRANSACTIONAL_HEADERS` (no open pixel, no link rewriting, no
List-Unsubscribe on a one-off requested email), sent through the shared
`sendEmail` — same sender as the booking mail. Wording below.

**Letter** (when `letter`):

```http
POST https://api.brevo.com/v3/contacts/doubleOptinConfirmation
api-key: <BREVO_API_KEY>
content-type: application/json

{
  "email": "reader@example.com",
  "includeListIds": [<BREVO_LETTER_LIST_ID>],
  "templateId": <BREVO_DOI_TEMPLATE_ID>,
  "redirectionUrl": "https://humanheart.life/en/take/automatic-yes?letter=confirmed",
  "attributes": { "SOURCE": "automatic-yes", "LANGUAGE": "en" }
}
```

Brevo answers `201` when it has sent the confirmation email. Treat an
"already exists" style response as success too: the reply must never reveal
whether an address is already on the list. Same 10-second timeout as
`sendEmail`. Send `attributes` only if Genia created them in Brevo (the setup
doc says how); otherwise omit the field.

**Response**: `200 { ok: true, pdf: "sent" | "failed" | "skipped", letter: "pending" | "failed" | "skipped", requestId }`.

**Never** log the address, store it in the database, or put it in an error
message. Brevo is the record. The rate-limit table keeps only the hashed key,
as it does today.

**Environment**: `BREVO_API_KEY` (exists), `BREVO_LETTER_LIST_ID`,
`BREVO_DOI_TEMPLATE_ID`, `SITE_URL` (exists, defaults to
`https://humanheart.life`).

### 2. Front end

- One flag, `SIGNUP_ENABLED`, in `src/config/` — `false` in Milestone 1,
  `true` here.
- `SignupCard` (PDF + optional letter) and `LetterForm` (letter only) call
  `supabase.functions.invoke("take-signup", { body })`.
- States: idle → sending (`signup.sending`, button disabled) → done or error.
  On success, disable the form.
- Messages, all from the content file:

| Result | Message |
|---|---|
| PDF sent, no letter | `signup.done` |
| PDF sent, letter pending | `signup.done_with_letter` |
| Letter-only form, pending | `letter.done` |
| Any requested part `failed`, or a network error | `signup.error` |
| `429` | `signup.rate_limited` |
| `400` | `signup.invalid` |

- The email inputs have visible labels (`signup.label`); the letter checkbox's
  label is `signup.consent`; the small print links `signup.privacy` to
  `langPath("/privacy")`.
- Still no PostHog calls.

### 3. Tests for Milestone 2

- `worksheetEmail.test.ts` (beside `bookingEmails.test.ts`): subject; the PDF
  link is absolute and points at `/downloads/…`; both HTML and text parts
  exist; `TRANSACTIONAL_HEADERS` are set; the reader's address appears nowhere
  but `to`.
- Form tests with `supabase.functions.invoke` mocked: each row of the message
  table above.
- `bookingEmails.test.ts` still passes unchanged after the `_shared` move.

### Milestone 2 is done when

- [ ] Ticking nothing and sending → one email with the PDF link arrives.
- [ ] Ticking the letter → the PDF email plus Brevo's confirmation email; after confirming, the address is on the "Monthly letter" list and the page shows the confirmation banner.
- [ ] The letter-only form → the confirmation email only.
- [ ] Six quick submissions from one browser → the sixth is refused politely.
- [ ] Function logs contain no email addresses.
- [ ] Booking emails are unchanged.

---

## Email wording

### Worksheet email (built in code, transactional)

- **Subject:** The automatic yes — your worksheet
- **Heading (in `shell`, green as the booking mail):** Your worksheet

Body:

> Hello,
>
> Here is the worksheet you asked for — ten pages, printable, to go through at your own pace.
>
> **[Download the PDF]** → `${SITE_URL}/downloads/the-automatic-yes-human-heart.pdf`
>
> It goes with the long-form video on people-pleasing on YouTube, Genia | Human Heart. If you would rather fill it in on screen, the same worksheet is on the site. ← "Genia | Human Heart" links to `https://www.youtube.com/@beathumanheart` (the function cannot import `src/config/social.ts`, so keep this one constant in `take-signup/lib/emails.ts` with a comment pointing there); "on the site" links to `${SITE_URL}/en/take/automatic-yes`
>
> One line from the first page: if something surfaces with more force than you can hold, stop. Some of this is better explored with a counsellor or therapist than alone.
>
> Genia
> Gestalt Counsellor · humanheart.life

Small print:

> You received this one email because this address asked for the worksheet on humanheart.life. Nothing else follows, unless you confirm the monthly letter.

The plain-text part carries the same words, with the URLs written out.

### Double opt-in email (a Brevo template — Genia creates it; see the setup doc)

- **Subject:** One click to confirm the monthly letter

> You asked to receive the monthly letter from Human Heart: one longer piece a month, on feelings and relationships.
>
> Please confirm that this address is yours:
>
> **[Confirm my address]**
>
> If this wasn't you, ignore this email and nothing will be sent.
>
> By confirming, you agree to receive the letter by email. Every letter carries a link to leave.
>
> Genia
> Human Heart · humanheart.life

---

## Not in this brief (noted for later)

- A Russian version of the worksheet.
- The footer's Substack icon and the Substack entry in `sameAs`
  (`src/config/social.ts`): once the letter runs from Brevo, Genia decides
  when they go.
- A page-specific social image (the peach cover): `PageMeta` uses one image
  per language today.
- An archive of past letters on the site.
