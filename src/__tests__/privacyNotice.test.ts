/**
 * The privacy notice must be finished before it is published.
 *
 * It is a drafted document with a few facts only Genia can supply — a legal
 * name, a postal address, a retention period, the date it goes up. Those are
 * written as [[LIKE THIS]], and this fails while any remain.
 *
 * Publishing a privacy notice containing "[[POSTAL ADDRESS]]" would be worse
 * than having none: it is the page a reader checks when they are deciding
 * whether to trust the practice with something personal.
 *
 * It also fails if the notice stops describing what the site does — the
 * claims below are checked against the code that implements them, so a change
 * to analytics or the worksheet cannot quietly make this page untrue.
 */

import { describe, expect, it } from "vitest";
import { privacyEN } from "@/content/privacy";
import { siteConfig, takeConfig } from "@/config/analytics";
import { STORAGE_KEY } from "@/components/automatic-yes/useWorksheetAnswers";

const allText = [
  privacyEN.title,
  privacyEN.updated,
  ...privacyEN.intro,
  ...privacyEN.closing,
  ...privacyEN.sections.flatMap((s) => [
    s.title,
    ...(s.paras ?? []),
    ...(s.rows ?? []).flatMap((r) => [r.term, r.text]),
  ]),
].join("\n");

describe("the notice is finished", () => {
  it("has no placeholders left", () => {
    const left = allText.match(/\[\[[^\]]+\]\]/g) ?? [];
    expect(
      left,
      `The privacy notice still needs these facts filled in:\n  ${left.join(
        "\n  ",
      )}\n\nEdit src/content/privacy.ts. Publishing it with placeholders would ` +
        `be worse than not publishing it at all.`,
    ).toEqual([]);
  });

  it("says who to write to", () => {
    expect(allText).toContain("be@humanheart.life");
  });

  it("names the supervisory authority a reader can complain to", () => {
    expect(allText).toMatch(/Data Protection Authority|Gegevensbeschermingsautoriteit/);
  });
});

describe("the notice matches what the site does", () => {
  it("only claims replay is off while it is actually off", () => {
    expect(allText).toContain("Session recording is switched off");
    expect(siteConfig.disable_session_recording).toBe(true);
    expect(takeConfig.disable_session_recording).toBe(true);
  });

  it("only claims /take stores nothing while that is true", () => {
    expect(allText).toContain("stores nothing on your device");
    // memory persistence is what makes that sentence true.
    expect(takeConfig.persistence).toBe("memory");
    expect(takeConfig.autocapture).toBe(false);
  });

  it("admits the identifier the main pages do store", () => {
    // siteConfig sets no persistence, so PostHog uses a cookie and local
    // storage. The notice says so rather than implying the site is cookieless.
    expect(siteConfig.persistence).toBeUndefined();
    expect(allText).toMatch(/cookie and a local storage entry/);
  });

  it("describes the worksheet's one storage key, and that it is opt-in", () => {
    expect(STORAGE_KEY).toBe("hh-automatic-yes-v1");
    expect(allText).toContain("Keep my answers on this device");
    expect(allText).toContain("never sent anywhere");
  });
});
