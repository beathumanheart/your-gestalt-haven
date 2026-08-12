/**
 * Every column named in the Edge Function's PostgREST selects must exist.
 *
 * PostgREST rejects the whole statement if one column name is wrong. The
 * booking-creation insert uses BOOKING_SELECT, so a single stale name there
 * takes down the entire booking flow — not just the feature that column
 * belongs to. That is exactly what happened with hidden_offers.title, which
 * migration 20260514000002 dropped in favour of title_en/title_ru.
 *
 * The schema is reconstructed from the migration files rather than a live
 * database so this runs in CI with no credentials.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "../..");
const MIGRATIONS_DIR = join(ROOT, "supabase/migrations");
const FUNCTION = readFileSync(
  join(ROOT, "supabase/functions/process-booking/index.ts"),
  "utf-8"
);

/** Replay the migrations in order, tracking columns added and dropped. */
function reconstructSchema(): Map<string, Set<string>> {
  const tables = new Map<string, Set<string>>();
  const files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql")).sort();

  for (const file of files) {
    const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf-8")
      .replace(/--[^\n]*/g, ""); // strip line comments; they mention dropped names

    // CREATE TABLE [public.]<name> ( ...column defs... );
    for (const m of sql.matchAll(
      /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?(\w+)\s*\(([\s\S]*?)\n\s*\);/gi
    )) {
      const [, table, body] = m;
      const cols = new Set<string>();
      for (const line of body.split("\n")) {
        const col = line.trim().match(/^(\w+)\s+\w/);
        if (col && !/^(CONSTRAINT|PRIMARY|FOREIGN|UNIQUE|CHECK)$/i.test(col[1])) {
          cols.add(col[1]);
        }
      }
      tables.set(table, cols);
    }

    // ALTER TABLE ... ADD/DROP COLUMN, possibly several per statement.
    for (const m of sql.matchAll(
      /ALTER\s+TABLE\s+(?:ONLY\s+)?(?:public\.)?(\w+)([\s\S]*?);/gi
    )) {
      const [, table, body] = m;
      const cols = tables.get(table) ?? new Set<string>();
      for (const add of body.matchAll(/ADD\s+COLUMN\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/gi)) {
        cols.add(add[1]);
      }
      for (const drop of body.matchAll(/DROP\s+COLUMN\s+(?:IF\s+EXISTS\s+)?(\w+)/gi)) {
        cols.delete(drop[1]);
      }
      tables.set(table, cols);
    }
  }

  return tables;
}

/** Pull `table(col, col)` embeds and the bare column list out of a select. */
function parseSelect(select: string): { table: string | null; columns: string[] }[] {
  const parts: { table: string | null; columns: string[] }[] = [];

  const embeds = [...select.matchAll(/(\w+)\(([^)]*)\)/g)];
  for (const [, table, cols] of embeds) {
    parts.push({ table, columns: cols.split(",").map((c) => c.trim()).filter(Boolean) });
  }

  const bare = select
    .replace(/\w+\([^)]*\)/g, "")
    .split(",")
    .map((c) => c.trim())
    .filter((c) => c && c !== "*");
  if (bare.length) parts.push({ table: null, columns: bare });

  return parts;
}

const schema = reconstructSchema();

describe("reconstructed schema", () => {
  it("finds the tables the function reads", () => {
    for (const table of ["bookings", "session_types", "hidden_offers"]) {
      expect(schema.has(table), `missing table ${table}`).toBe(true);
    }
  });

  it("reflects columns added by later migrations", () => {
    expect(schema.get("bookings")).toContain("slug");
    expect(schema.get("bookings")).toContain("moderator_slug");
    expect(schema.get("hidden_offers")).toContain("calendar_summary");
    expect(schema.get("session_types")).toContain("calendar_summary");
  });

  it("reflects columns dropped by later migrations", () => {
    // The regression under test: dropped in 20260514000002.
    expect(schema.get("hidden_offers")).not.toContain("title");
    expect(schema.get("hidden_offers")).toContain("title_en");
  });
});

/** Select strings assigned to a module-level const, so `.select(NAME)` resolves. */
function selectConstants(): Map<string, string> {
  const consts = new Map<string, string>();
  for (const m of FUNCTION.matchAll(
    /const\s+(\w*SELECT\w*)\s*=\s*\n?\s*("(?:[^"\\]|\\.)*")/g
  )) {
    consts.set(m[1], JSON.parse(m[2]));
  }
  return consts;
}

/** Pair each `.from("table")` with the `.select(...)` that follows it. */
function fromSelectPairs(): { table: string; select: string }[] {
  const consts = selectConstants();
  const pairs: { table: string; select: string }[] = [];

  for (const m of FUNCTION.matchAll(
    /\.from\("(\w+)"\)[\s\S]{0,400}?\.select\(\s*(?:("(?:[^"\\]|\\.)*")|(\w+))\s*[,)]/g
  )) {
    const [, table, literal, identifier] = m;
    const select = literal ? (JSON.parse(literal) as string) : consts.get(identifier);
    if (select) pairs.push({ table, select });
  }
  return pairs;
}

describe("edge function selects", () => {
  const pairs = fromSelectPairs();

  it("finds the queries to check, including the shared BOOKING_SELECT", () => {
    expect(pairs.length).toBeGreaterThan(2);
    expect(pairs.some((p) => p.select.includes("hidden_offers("))).toBe(true);
    expect(pairs.some((p) => p.table === "hidden_offers")).toBe(true);
  });

  it.each(fromSelectPairs().map((p) => [`${p.table}: ${p.select.slice(0, 60)}`, p]))(
    "%s… references only columns that exist",
    (_label, pair: { table: string; select: string }) => {
      for (const { table, columns } of parseSelect(pair.select)) {
        // Bare columns belong to the table being queried; embeds name their own.
        const target = table ?? pair.table;
        const known = schema.get(target);
        expect(known, `unknown table ${target}`).toBeDefined();
        for (const column of columns) {
          expect(
            known.has(column),
            `${target}.${column} does not exist — check the migrations`
          ).toBe(true);
        }
      }
    }
  );
});
