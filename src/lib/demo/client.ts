/**
 * Демо-режим: подменяет клиент Supabase, когда переменные окружения не заданы.
 * Понимает ровно тот срез запросов, который использует приложение, — это не
 * эмулятор Postgres, а способ увидеть продукт целиком без заведения базы.
 *
 * Данные лежат в памяти процесса: правки живут до перезапуска сервера.
 */

import { randomUUID } from "node:crypto";
import {
  seedBusinesses,
  seedCampaignCreators,
  seedCampaigns,
  seedCreators,
  seedDeletionRequests,
  seedProfiles,
  seedStatusLog,
  type Row,
} from "./seed";

// ─────────────────────────  ХРАНИЛИЩЕ  ─────────────────────────

type Tables = Record<string, Row[]>;

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

// globalThis, чтобы горячая перезагрузка в dev не сбрасывала правки на каждый чих
const globalStore = globalThis as unknown as { __demoTables?: Tables };

function tables(): Tables {
  if (!globalStore.__demoTables) {
    globalStore.__demoTables = {
      profiles: clone(seedProfiles),
      creators: clone(seedCreators),
      businesses: clone(seedBusinesses),
      campaigns: clone(seedCampaigns),
      campaign_creators: clone(seedCampaignCreators),
      campaign_status_log: clone(seedStatusLog),
      data_deletion_requests: clone(seedDeletionRequests),
    };
  }
  return globalStore.__demoTables;
}

/** Вьюха creator_public собирается на лету — как и в базе, наружу только публичное. */
function creatorPublic(): Row[] {
  return tables()
    .creators.filter((c) => c.status === "active")
    .map((c) => ({
      id: c.id,
      display_name: c.nickname ?? c.full_name,
      city: c.city,
      niches: c.niches,
      instagram_url: c.instagram_url,
      tiktok_url: c.tiktok_url,
      ig_followers: c.ig_followers,
      tt_followers: c.tt_followers,
      engagement_rate: c.engagement_rate,
      avg_reels_views: c.avg_reels_views,
      price_min: c.price_min,
      price_max: c.price_max,
      portfolio: c.portfolio,
      data_source: c.data_source,
      instagram_connected: c.instagram_connected,
    }));
}

function readTable(name: string): Row[] {
  if (name === "creator_public") return creatorPublic();
  return tables()[name] ?? [];
}

// ─────────────────────────  СВЯЗИ  ─────────────────────────

/**
 * Значения по умолчанию — то, что в настоящей базе проставляет DEFAULT в схеме.
 * Без них форма, которая не шлёт поле (например, бриф не задаёт status),
 * создавала бы запись с дырами, и страница падала бы на `undefined.length`.
 */
const DEFAULTS: Record<string, () => Row> = {
  campaigns: () => ({
    status: "new_request",
    audience_gender: "any",
    formats: [],
    deliverables: [],
    report_text: null,
    report_file_url: null,
    updated_at: new Date().toISOString(),
  }),
  creators: () => ({
    city: "Алматы",
    niches: [],
    portfolio: [],
    tier: "novice",
    status: "active",
    data_source: "manual",
    instagram_connected: false,
    instagram_user_id: null,
    instagram_username: null,
    instagram_access_token: null,
    instagram_token_expires_at: null,
    instagram_last_synced_at: null,
    instagram_deletion_requested_at: null,
    consent_data_processing: false,
    connect_token: randomUUID(),
    updated_at: new Date().toISOString(),
  }),
  businesses: () => ({ city: "Алматы", owner_id: null }),
  campaign_creators: () => ({
    status: "brief",
    visible_to_client: true,
    rate_quality: null,
    rate_communication: null,
    rate_deadline: null,
    rate_brief: null,
  }),
  data_deletion_requests: () => ({ source: "meta", completed_at: null }),
};

type RelDef = { table: string; fk: string; kind: "one" | "many" };

const RELATIONS: Record<string, Record<string, RelDef>> = {
  campaigns: { businesses: { table: "businesses", fk: "business_id", kind: "one" } },
  campaign_creators: {
    creators: { table: "creators", fk: "creator_id", kind: "one" },
    campaigns: { table: "campaigns", fk: "campaign_id", kind: "one" },
  },
  businesses: { campaigns: { table: "campaigns", fk: "business_id", kind: "many" } },
};

type RelNode = { name: string; inner: string };

/** Достаёт из строки select только вложенные связи: "*, businesses(name)" → businesses. */
function parseRelations(select: string): RelNode[] {
  const nodes: RelNode[] = [];
  let token = "";
  for (let i = 0; i < select.length; i++) {
    const ch = select[i];
    if (ch === "(") {
      let depth = 1;
      let j = i + 1;
      while (j < select.length && depth > 0) {
        if (select[j] === "(") depth++;
        if (select[j] === ")") depth--;
        j++;
      }
      const name = token.split(",").pop()!.trim();
      if (name) nodes.push({ name, inner: select.slice(i + 1, j - 1) });
      token = "";
      i = j - 1;
    } else if (ch === ",") {
      token = "";
    } else {
      token += ch;
    }
  }
  return nodes;
}

function expand(table: string, rows: Row[], select: string): Row[] {
  const nodes = parseRelations(select);
  if (nodes.length === 0) return rows;

  return rows.map((row) => {
    const out: Row = { ...row };
    for (const node of nodes) {
      const rel = RELATIONS[table]?.[node.name];
      if (!rel) continue;

      if (rel.kind === "one") {
        const target = readTable(rel.table).find((r) => r.id === row[rel.fk]);
        out[node.name] = target ? expand(rel.table, [target], node.inner)[0] : null;
      } else {
        const children = readTable(rel.table).filter((r) => r[rel.fk] === row.id);
        out[node.name] = expand(rel.table, children, node.inner);
      }
    }
    return out;
  });
}

// ─────────────────────────  БИЛДЕР ЗАПРОСА  ─────────────────────────

type Result = { data: unknown; error: { message: string } | null; count?: number };

type Predicate = (row: Row) => boolean;

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

/** "(a,b,c)" → ["a","b","c"] — формат, в котором PostgREST принимает список для not.in */
function parseList(raw: string): string[] {
  return raw
    .replace(/^\(|\)$/g, "")
    .split(",")
    .map((s) => s.trim().replace(/^"|"$/g, ""))
    .filter(Boolean);
}

class DemoQuery implements PromiseLike<Result> {
  private predicates: Predicate[] = [];
  private mode: "select" | "insert" | "update" | "upsert" | "delete" = "select";
  private payload: Row[] = [];
  private selectString = "*";
  private wantsCount = false;
  private headOnly = false;
  private returning = false;
  private singleMode: "none" | "single" | "maybe" = "none";
  private orderBy: { column: string; ascending: boolean; nullsFirst: boolean } | null = null;
  private limitTo: number | null = null;
  private ignoreDuplicates = false;

  constructor(private table: string) {}

  select(columns = "*", options?: { count?: string; head?: boolean }) {
    this.selectString = columns;
    this.returning = true;
    if (options?.count) this.wantsCount = true;
    if (options?.head) this.headOnly = true;
    return this;
  }

  insert(rows: Row | Row[]) {
    this.mode = "insert";
    this.payload = Array.isArray(rows) ? rows : [rows];
    return this;
  }

  upsert(rows: Row | Row[], options?: { onConflict?: string; ignoreDuplicates?: boolean }) {
    this.mode = "upsert";
    this.payload = Array.isArray(rows) ? rows : [rows];
    this.ignoreDuplicates = options?.ignoreDuplicates ?? false;
    return this;
  }

  update(values: Row) {
    this.mode = "update";
    this.payload = [values];
    return this;
  }

  delete() {
    this.mode = "delete";
    return this;
  }

  eq(column: string, value: unknown) {
    this.predicates.push((row) => String(row[column] ?? "") === String(value ?? ""));
    return this;
  }

  neq(column: string, value: unknown) {
    this.predicates.push((row) => String(row[column] ?? "") !== String(value ?? ""));
    return this;
  }

  in(column: string, values: unknown[]) {
    const set = new Set(values.map(String));
    this.predicates.push((row) => set.has(String(row[column])));
    return this;
  }

  not(column: string, operator: string, value: unknown) {
    if (operator === "in") {
      const set = new Set(parseList(String(value)));
      this.predicates.push((row) => !set.has(String(row[column])));
    } else {
      this.predicates.push((row) => String(row[column] ?? "") !== String(value ?? ""));
    }
    return this;
  }

  gte(column: string, value: number) {
    this.predicates.push((row) => Number(row[column] ?? 0) >= Number(value));
    return this;
  }

  lte(column: string, value: number) {
    this.predicates.push((row) => Number(row[column] ?? Number.POSITIVE_INFINITY) <= Number(value));
    return this;
  }

  /** Массив содержит все указанные значения — аналог оператора @> для text[]. */
  contains(column: string, values: unknown[]) {
    this.predicates.push((row) => {
      const arr = asArray(row[column]).map(String);
      return values.every((v) => arr.includes(String(v)));
    });
    return this;
  }

  /** Поддерживаем только форму "col.ilike.%текст%,col2.ilike.%текст%" — она и используется. */
  or(expression: string) {
    const clauses = expression.split(",").map((part) => {
      const [column, operator, ...rest] = part.split(".");
      const needle = rest.join(".").replace(/%/g, "").toLowerCase();
      return { column, operator, needle };
    });

    this.predicates.push((row) =>
      clauses.some(({ column, operator, needle }) => {
        const value = String(row[column] ?? "").toLowerCase();
        return operator === "ilike" ? value.includes(needle) : value === needle;
      }),
    );
    return this;
  }

  order(column: string, options?: { ascending?: boolean; nullsFirst?: boolean }) {
    this.orderBy = {
      column,
      ascending: options?.ascending ?? true,
      nullsFirst: options?.nullsFirst ?? false,
    };
    return this;
  }

  limit(count: number) {
    this.limitTo = count;
    return this;
  }

  single() {
    this.singleMode = "single";
    this.returning = true;
    return this;
  }

  maybeSingle() {
    this.singleMode = "maybe";
    this.returning = true;
    return this;
  }

  // ─── выполнение ───

  private matches(rows: Row[]): Row[] {
    return rows.filter((row) => this.predicates.every((p) => p(row)));
  }

  private sortAndSlice(rows: Row[]): Row[] {
    let out = [...rows];

    if (this.orderBy) {
      const { column, ascending, nullsFirst } = this.orderBy;
      out.sort((a, b) => {
        const av = a[column];
        const bv = b[column];
        const aNull = av === null || av === undefined;
        const bNull = bv === null || bv === undefined;
        if (aNull && bNull) return 0;
        if (aNull) return nullsFirst ? -1 : 1;
        if (bNull) return nullsFirst ? 1 : -1;
        if (typeof av === "number" && typeof bv === "number") {
          return ascending ? av - bv : bv - av;
        }
        const cmp = String(av).localeCompare(String(bv));
        return ascending ? cmp : -cmp;
      });
    }

    if (this.limitTo !== null) out = out.slice(0, this.limitTo);
    return out;
  }

  private run(): Result {
    const store = tables();
    const isView = this.table === "creator_public";
    const rows = readTable(this.table);

    if (this.mode === "select") {
      const found = this.matches(rows);
      if (this.headOnly) return { data: null, error: null, count: found.length };
      const shaped = expand(this.table, this.sortAndSlice(found), this.selectString);
      return this.finish(shaped, found.length);
    }

    if (isView) return { data: null, error: { message: "creator_public — только чтение" } };
    const target = store[this.table];

    if (this.mode === "insert" || this.mode === "upsert") {
      const inserted: Row[] = [];
      for (const item of this.payload) {
        if (this.mode === "upsert") {
          const duplicate = target.find(
            (row) =>
              row.campaign_id === item.campaign_id && row.creator_id === item.creator_id,
          );
          if (duplicate) {
            if (this.ignoreDuplicates) continue;
            Object.assign(duplicate, item);
            inserted.push(duplicate);
            continue;
          }
        }
        const row: Row = {
          id: randomUUID(),
          created_at: new Date().toISOString(),
          ...(DEFAULTS[this.table]?.() ?? {}),
          ...item,
        };
        target.push(row);
        inserted.push(row);
        this.afterInsert(row);
      }
      return this.finish(inserted, inserted.length);
    }

    if (this.mode === "update") {
      const found = this.matches(target);
      const values = this.payload[0] ?? {};
      for (const row of found) {
        const before = row.status;
        Object.assign(row, values, { updated_at: new Date().toISOString() });
        if (this.table === "campaigns" && values.status && values.status !== before) {
          this.logStatus(row, before as string | null);
        }
      }
      return this.finish(found, found.length);
    }

    // delete
    const found = this.matches(target);
    for (const row of found) {
      const index = target.indexOf(row);
      if (index >= 0) target.splice(index, 1);
    }
    return this.finish(found, found.length);
  }

  /** Повторяем триггер из базы: каждая смена статуса попадает в журнал. */
  private logStatus(campaign: Row, from: string | null) {
    tables().campaign_status_log.push({
      id: randomUUID(),
      campaign_id: campaign.id,
      from_status: from,
      to_status: campaign.status,
      changed_by: "demo-admin",
      changed_at: new Date().toISOString(),
      note: null,
    });
  }

  private afterInsert(row: Row) {
    if (this.table === "campaigns") this.logStatus(row, null);
    if (this.table === "creators" && !row.connect_token) {
      row.connect_token = randomUUID();
    }
  }

  private finish(rows: Row[], count: number): Result {
    if (this.singleMode !== "none") {
      const first = rows[0] ?? null;
      if (!first && this.singleMode === "single") {
        return { data: null, error: { message: "Строка не найдена" }, count: 0 };
      }
      return { data: first, error: null, count };
    }
    return { data: this.returning || this.mode === "select" ? rows : null, error: null, count };
  }

  then<TResult1 = Result, TResult2 = never>(
    onfulfilled?: ((value: Result) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    try {
      return Promise.resolve(this.run()).then(onfulfilled, onrejected);
    } catch (error) {
      return Promise.reject(error).then(onfulfilled, onrejected);
    }
  }
}

// ─────────────────────────  КЛИЕНТ  ─────────────────────────

export type DemoAuthState = { userId: string | null };

export function createDemoClient(auth: DemoAuthState) {
  return {
    from(table: string) {
      return new DemoQuery(table);
    },

    auth: {
      async getUser() {
        if (!auth.userId) return { data: { user: null }, error: null };
        return { data: { user: { id: auth.userId } }, error: null };
      },
      async signInWithPassword() {
        return { data: null, error: { message: "В демо-режиме вход по кнопке" } };
      },
      async signUp() {
        return { data: null, error: { message: "В демо-режиме регистрация недоступна" } };
      },
      async signOut() {
        return { error: null };
      },
    },

    storage: {
      from() {
        return {
          async upload(path: string) {
            return { data: { path }, error: null };
          },
          getPublicUrl(path: string) {
            return { data: { publicUrl: `/demo-file/${encodeURIComponent(path)}` } };
          },
        };
      },
    },
  };
}

export type DemoClient = ReturnType<typeof createDemoClient>;
