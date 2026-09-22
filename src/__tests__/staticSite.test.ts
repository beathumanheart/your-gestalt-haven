import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import {
  assertNoForbiddenPaths,
  renderRoutePage,
  renderSitemap,
} from "../../scripts/static-site/render";
import { injectSiteJsonLd } from "../../scripts/static-site/jsonLd";
import {
  LANGS,
  STATIC_ROUTES,
  bookingRouteText,
  type MetaLang,
  type StaticRoute,
} from "@/config/pageMetadata";

/**
 * The real template, not a fixture. The failure this guards against is
 * someone renaming a meta tag in index.html and the generated pages quietly
 * keeping the homepage's head — so the test has to read the same file the
 * build reads.
 *
 * Passed through the same JSON-LD injection the build applies, because
 * render.ts runs on the *built* index.html: the source file still has
 * "__JSONLD_PERSON__" placeholders where the nodes belong.
 */
const source = readFileSync(resolve(__dirname, "../../index.html"), "utf-8");
const template = injectSiteJsonLd(source);

describe("renderRoutePage", () => {
  it("renders every indexable route in both languages from the real index.html", () => {
    for (const route of STATIC_ROUTES) {
      for (const lang of LANGS) {
        const html = renderRoutePage(template, {
          canonicalPath: `/${lang}${route.path}`,
          lang,
          text: route,
        });

        const expectedTitle = lang === "ru" ? route.titleRu : route.titleEn;
        // The title is HTML-escaped, so compare on a marker that survives it.
        expect(html).toContain(`<html lang="${lang}">`);
        expect(html).toContain(`href="https://humanheart.life/${lang}${route.path}" />`);
        expect(html).toContain(expectedTitle.replace(/&/g, "&amp;"));
      }
    }
  });

  it("sets the canonical, both hreflang alternates, and x-default", () => {
    const html = renderRoutePage(template, {
      canonicalPath: "/ru/take",
      lang: "ru",
      text: STATIC_ROUTES[1],
    });

    expect(html).toContain('<link rel="canonical" href="https://humanheart.life/ru/take" />');
    expect(html).toContain('<link rel="alternate" hreflang="ru" href="https://humanheart.life/ru/take" />');
    expect(html).toContain('<link rel="alternate" hreflang="en" href="https://humanheart.life/en/take" />');
    // x-default is English whichever page it is on.
    expect(html).toContain('<link rel="alternate" hreflang="x-default" href="https://humanheart.life/en/take" />');
  });

  it("puts the language's own text and image in the head, not the default", () => {
    const html = renderRoutePage(template, {
      canonicalPath: "/ru",
      lang: "ru",
      text: STATIC_ROUTES[0],
    });

    expect(html).toContain('content="https://humanheart.life/og-image-ru.jpg"');
    expect(html).toContain('<meta property="og:locale" content="ru_RU" />');
    expect(html).toContain('<meta property="og:locale:alternate" content="en_US" />');
    expect(html).toContain("Психолог-консультант");
    // The English default must not survive anywhere in the head.
    expect(html).not.toContain("Counselling &amp; Accompaniment");
  });

  it("leaves the body's module script alone, so the page still boots the SPA", () => {
    const html = renderRoutePage(template, {
      canonicalPath: "/en/take",
      lang: "en",
      text: STATIC_ROUTES[1],
    });

    expect(html).toContain('<div id="root"></div>');
    expect(html).toMatch(/<script type="module"[^>]*src="\/[^"]+"/);
  });

  it("escapes a title rather than letting it break out of the tag", () => {
    const html = renderRoutePage(template, {
      canonicalPath: "/en/book/x",
      lang: "en",
      text: bookingRouteText({ name: 'Grief & "loss" <session>' }),
    });

    expect(html).toContain("Grief &amp; &quot;loss&quot; &lt;session&gt;");
    expect(html).not.toContain("<session>");
  });

  it("throws when the template no longer has a tag it must replace", () => {
    const stripped = template.replace(/<meta name="description"[^>]*>/, "");

    expect(() =>
      renderRoutePage(stripped, {
        canonicalPath: "/en",
        lang: "en",
        text: STATIC_ROUTES[0],
      }),
    ).toThrow(/exactly one <meta name="description">/);
  });
});

describe("site-wide JSON-LD", () => {
  const parseNodes = (html: string) =>
    [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) =>
      JSON.parse(m[1]),
    );

  const render = (lang: MetaLang) =>
    renderRoutePage(template, {
      canonicalPath: `/${lang}`,
      lang,
      text: STATIC_ROUTES[0],
    });

  it("describes the practice in Russian on a Russian page", () => {
    const nodes = parseNodes(render("ru"));
    const person = nodes.find((n) => n["@type"] === "Person");
    const service = nodes.find((n) => n["@type"] === "ProfessionalService");

    expect(person.jobTitle).toBe("гештальт-терапевт");
    expect(service.description).toMatch(/^Тёплое пространство/);
    expect(service.areaServed).toBe("Весь мир (онлайн)");
    for (const topic of person.knowsAbout) {
      expect(topic).toMatch(/[А-Яа-яЁё]/);
    }
  });

  it("leaves no English identity prose on a Russian page", () => {
    const nodes = parseNodes(render("ru"));

    expect(JSON.stringify(nodes)).not.toContain("Gestalt Counsellor");
    expect(JSON.stringify(nodes)).not.toContain("Worldwide (online)");
    expect(JSON.stringify(nodes)).not.toContain("grief counselling");
  });

  it("keeps the English node exactly as index.html has it", () => {
    // The English pages must be byte-identical to the template here, so this
    // localisation cannot churn what is already indexed.
    const templateBlocks = template.match(
      /<script type="application\/ld\+json">[\s\S]*?<\/script>/g,
    );
    const renderedBlocks = render("en").match(
      /<script type="application\/ld\+json">[\s\S]*?<\/script>/g,
    );

    expect(renderedBlocks).toEqual(templateBlocks);
  });

  it("gives both languages the same @id, so it is one person not two", () => {
    const [en, ru] = [parseNodes(render("en")), parseNodes(render("ru"))];
    const idsOf = (nodes: Array<Record<string, unknown>>) => nodes.map((n) => n["@id"]).sort();

    expect(idsOf(ru)).toEqual(idsOf(en));
    // And the credentials stay put: they are third-party-checkable claims.
    const personOf = (nodes: Array<Record<string, unknown>>) =>
      nodes.find((n) => n["@type"] === "Person") as Record<string, unknown>;
    expect(personOf(ru).hasCredential).toEqual(personOf(en).hasCredential);
    expect(personOf(ru).alumniOf).toEqual(personOf(en).alumniOf);
  });

  it("identifies every institution by url, not by name", () => {
    // The point of the url/sameAs pair: a crawler can resolve them, and
    // cannot resolve a name. A node with neither identifies nothing.
    const person = parseNodes(render("en")).find((n) => n["@type"] === "Person");
    const institutions = [
      ...person.alumniOf,
      ...person.hasCredential.map((c: Record<string, unknown>) => c.recognizedBy),
    ];

    expect(institutions.length).toBeGreaterThan(0);
    for (const org of institutions) {
      expect(org).toBeTruthy();
      expect(org.url).toMatch(/^https:\/\//);
    }
  });

  it("points sameAs at the right KU Leuven, not the pre-1968 one", () => {
    // Q644789 is the institution that split in 1968 and Q2901923 the umbrella
    // association. Picking either would assert the degree came from a
    // different legal body.
    const json = JSON.stringify(parseNodes(render("en")));

    expect(json).toContain("wikidata.org/wiki/Q833670");
    expect(json).not.toContain("Q644789");
    expect(json).not.toContain("Q2901923");
  });

  it("names institutions identically in both languages", () => {
    // An institution's name is its own official name, so it is not a
    // translation and must not drift per language. Exonyms would break this.
    const namesOf = (lang: MetaLang) => {
      const person = parseNodes(render(lang)).find((n) => n["@type"] === "Person");
      return person.alumniOf.map((o: Record<string, unknown>) => o.name ?? null);
    };

    expect(namesOf("ru")).toEqual(namesOf("en"));
    expect(namesOf("en")).toContain("KU Leuven");
    expect(namesOf("en")).toContain("University of Tartu");
  });

  it("leaves the Saint Petersburg institute unnamed rather than guessing", () => {
    // Its own tagline is not its name, and the legal form on the diploma is
    // not to hand. A url with no name asserts less than a wrong name.
    const person = parseNodes(render("en")).find((n) => n["@type"] === "Person");
    const spb = person.alumniOf.find((o: Record<string, unknown>) =>
      String(o.url).includes("education-psy.ru"),
    );

    expect(spb).toBeTruthy();
    expect(spb.name).toBeUndefined();
    expect(spb["@type"]).toBe("EducationalOrganization");
  });

  it("throws rather than guess when a JSON-LD block has no known @id", () => {
    // Replace the injected Service node with one carrying no known @id —
    // what reaches render.ts if someone hand-adds a node to index.html.
    const stripped = template.replace(
      /<script type="application\/ld\+json">[\s\S]*?#service[\s\S]*?<\/script>/,
      '<script type="application/ld+json">{"@type":"Thing"}</script>',
    );

    expect(() =>
      renderRoutePage(stripped, { canonicalPath: "/en", lang: "en", text: STATIC_ROUTES[0] }),
    ).toThrow(/carries neither/);
  });
});

describe("renderSitemap", () => {
  const xml = renderSitemap(STATIC_ROUTES, "2026-01-01");
  /** Routes are not all bilingual: an English-only one lists one URL. */
  const langsOf = (route: StaticRoute) => route.langs ?? LANGS;

  it("emits one url per language the route exists in", () => {
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    const expected = STATIC_ROUTES.reduce((sum, route) => sum + langsOf(route).length, 0);
    expect(locs).toHaveLength(expected);
  });

  it("gives a bilingual url the full alternate set, self-reference included", () => {
    const bilingual = STATIC_ROUTES.find((r) => langsOf(r).length === 2)!;
    const block = xml
      .split("<url>")
      .find((u) => u.includes(`<loc>https://humanheart.life/en${bilingual.path}</loc>`))!;

    expect(block).toContain('hreflang="en"');
    expect(block).toContain('hreflang="ru"');
    expect(block).toContain('hreflang="x-default"');
  });

  it("gives a single-language url no alternate in a language it does not exist in", () => {
    // Pointing hreflang at a URL that 404s is worse than saying nothing.
    const only = STATIC_ROUTES.find((r) => langsOf(r).length === 1);
    expect(only, "no single-language route to check — this test would be vacuous").toBeTruthy();

    const block = xml
      .split("<url>")
      .find((u) => u.includes(`<loc>https://humanheart.life/en${only!.path}</loc>`))!;

    expect(block).toContain('hreflang="en"');
    expect(block).not.toContain('hreflang="ru"');
    // x-default belongs on the only page there is.
    expect(block).toContain(`hreflang="x-default" href="https://humanheart.life/en${only!.path}"`);
    // And the other language gets no <url> at all.
    expect(xml).not.toContain(`<loc>https://humanheart.life/ru${only!.path}</loc>`);
  });

  it("lists the same path the page canonicalises to", () => {
    // A sitemap URL that does not match the page's own canonical is how a
    // crawler ends up indexing neither.
    for (const route of STATIC_ROUTES) {
      for (const lang of langsOf(route)) {
        const canonicalPath = `/${lang}${route.path}`;
        expect(xml).toContain(`<loc>https://humanheart.life${canonicalPath}</loc>`);
        expect(
          renderRoutePage(template, {
            canonicalPath,
            lang,
            text: route,
            langs: route.langs,
          }),
        ).toContain(`<link rel="canonical" href="https://humanheart.life${canonicalPath}" />`);
      }
    }
  });
});

describe("a single-language route's head", () => {
  const only = STATIC_ROUTES.find((r) => (r.langs ?? LANGS).length === 1)!;
  const html = renderRoutePage(template, {
    canonicalPath: `/en${only.path}`,
    lang: "en",
    text: only,
    langs: only.langs,
  });

  it("claims no alternate in a language the page does not exist in", () => {
    expect(html).not.toContain('hreflang="ru"');
    expect(html).not.toContain("/ru" + only.path);
  });

  it("points x-default at itself", () => {
    expect(html).toContain(
      `<link rel="alternate" hreflang="x-default" href="https://humanheart.life/en${only.path}" />`,
    );
  });

  it("advertises no alternate locale", () => {
    expect(html).not.toContain("og:locale:alternate");
    expect(html).toContain('<meta property="og:locale" content="en_US" />');
  });
});

describe("assertNoForbiddenPaths", () => {
  it("accepts the routes the build actually generates", () => {
    const paths = STATIC_ROUTES.flatMap((route) =>
      LANGS.map((lang) => `/${lang}${route.path}`),
    );
    expect(() => assertNoForbiddenPaths(paths)).not.toThrow();
  });

  it("refuses a short session link, which would publish the room's token", () => {
    expect(() => assertNoForbiddenPaths(["/en/s/abc123"])).toThrow(/capability-token/);
    expect(() => assertNoForbiddenPaths(["/ru/c/abc123"])).toThrow(/capability-token/);
    expect(() => assertNoForbiddenPaths(["/en/admin"])).toThrow(/capability-token/);
  });
});
