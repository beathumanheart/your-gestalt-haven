# Terminology: the terms this site does not use, and why

This is the one file in the repository where the avoided terms may be
written. `src/__tests__/bannedTerminology.test.ts` scans everything else —
source, `public/`, `docs/`, and the built `dist/` — and fails on these
substrings, case-insensitively, in code and in comments alike.

That breadth is deliberate. The guard once caught one of these terms in an
explanatory code comment, and a guard scoped only to user-facing strings
would have missed it. But it also meant the reasoning for avoiding a term
could not be written down anywhere, and that reasoning is the thing that
stops someone reintroducing the term later. Hence this file, and hence
exactly one exemption for it, by exact path.

**If you are here because the guard failed your build:** the term you used is
below, with what to use instead. Do not add your term to the exemption, and
do not widen the exemption to a directory. Reword, and if the reasoning needs
recording, record it here.

## Blind spot: text inside images

The guard reads files as text, so a term drawn into an image is invisible to
it. That is not hypothetical — both social preview cards
(`public/og-image-en.png`, `public/og-image-ru.png`) state a protected title
in their artwork while every line of source around them says "Gestalt
Counsellor" / «гештальт-терапевт». See #55.

OCR in a unit test is not worth it. Instead: **when an image contains words,
read the words.** Any new card, banner, or screenshot with text on it needs a
human look before it ships, because nothing downstream will catch it.

### The same blind spot, off-site

Everything above stops at the edge of this repository, and most of what a
prospective client reads is outside it. No guard here can see:

- social and directory **bios** — Instagram, Threads, Telegram, YouTube,
  Substack, therapist listings
- **channel and page descriptions**, pinned posts, link-in-bio pages
- **thumbnails, carousels, story templates, slides** — text in images again,
  now also beyond the repo
- ad copy, newsletter headers, email signatures, business cards

These are the same claim in the same places a search engine and a client will
read it, and several outlive any edit here. When the title changes, they have
to be changed by hand, one by one. Treat this list as the checklist.

## `psychotherapeut`, `klinisch psycholoog` — and so `psychotherap*`, `psychologist`

Both are professional titles protected under Belgian law and reserved to
practitioners on the federal register. Genia practises in Belgium and is not
registered under either, so a page that used them — or that used an English
word a reader would map onto them — would make a claim about regulated
status that is not true.

The ban is on the substrings rather than the exact Dutch titles because the
risk is the claim, not the spelling: "psychotherapy", "psychotherapist" and
"psychologist" all carry it in English.

**Use instead:** "Gestalt Counsellor" for the job title, "counselling" for
the work. See `JOB_TITLE` in `src/config/identity.ts`.

### What is *not* banned, and why

- The **`психолог` stem** is fine — «психолог-консультант» is the title on
  the Saint Petersburg diploma and is used on the Russian pages.
- **`clinical`** is fine — the offer agreement legitimately says counselling
  is not a substitute for treatment of clinical diagnoses.

## `психотерап*`

The Russian cognate carries the same implication of a regulated clinical
qualification, so it is avoided for the same reason.

**Use instead:** «гештальт-терапевт». Note this is deliberately *not* a
translation of the English "Gestalt Counsellor": «консультант» would
understate the work in Russian-language practice, where «гештальт-терапевт»
is the ordinary, unregulated descriptor. The two titles are set per language
on purpose and must not be harmonised — harmonising them in the English
direction reintroduces the regulatory claim above.

This is also why third-party names are quoted, never translated: the tagline
of the institute at <https://education-psy.ru/> contains this stem, which is
one of several reasons that institution is identified in structured data by
URL and left unnamed rather than being given a name of our own devising.

## `EAGT-accredited`, `EAGT accredited`, `accredited by EAGT`, `аккредитован EAGT`

Genia works **in accordance with the ethical standards published by** the
European Association for Gestalt Therapy. That is voluntary alignment. It is
not accreditation, not membership, and not a credential, and the distinction
is maintained on purpose for the Belgian regulatory context.

Structured data therefore encodes no `memberOf` and no EAGT credential — see
the comment on `CREDENTIALS` in `src/config/identity.ts` — and the visible
copy states the alignment in a full sentence, where it can be qualified.

**Use instead:** the sentence already in `src/content/credentials.ts`.
