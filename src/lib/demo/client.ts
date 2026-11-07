import { getDemoStore } from "@/lib/demo/store";
import { DEMO_OWNER_ID } from "@/lib/auth/demo-token";

type Row = Record<string, unknown>;

class DemoQuery implements PromiseLike<{ data: unknown; error: unknown; count: number | null }> {
  private table: string;
  private store: Record<string, Row[]>;
  private rows: Row[];
  private mode: "select" | "insert" | "update" | "delete" | "upsert" = "select";
  private payload: Row | Row[] | null = null;
  private countHead = false;
  private selectArg = "*";

  constructor(table: string, store: Record<string, Row[]>) {
    this.table = table;
    this.store = store;
    this.rows = [...(store[table] ?? [])];
  }

  select(columns?: string, options?: { count?: string; head?: boolean }) {
    this.selectArg = columns ?? "*";
    if (options?.head && options?.count === "exact") this.countHead = true;
    return this;
  }

  eq(key: string, value: unknown) {
    this.rows = this.rows.filter((row) => row[key] === value);
    return this;
  }

  is(key: string, value: unknown) {
    this.rows = this.rows.filter((row) => row[key] === value || (value === null && row[key] == null));
    return this;
  }

  in(key: string, values: unknown[]) {
    this.rows = this.rows.filter((row) => values.includes(row[key]));
    return this;
  }

  neq(key: string, value: unknown) {
    this.rows = this.rows.filter((row) => row[key] !== value);
    return this;
  }

  or() {
    return this;
  }

  lte(key: string, value: unknown) {
    this.rows = this.rows.filter((row) => String(row[key] ?? "") <= String(value));
    return this;
  }

  gte(key: string, value: unknown) {
    this.rows = this.rows.filter((row) => String(row[key] ?? "") >= String(value));
    return this;
  }

  order(key: string, options?: { ascending?: boolean }) {
    const asc = options?.ascending !== false;
    this.rows.sort((a, b) => {
      const left = String(a[key] ?? "");
      const right = String(b[key] ?? "");
      return asc ? left.localeCompare(right) : right.localeCompare(left);
    });
    return this;
  }

  limit(n: number) {
    this.rows = this.rows.slice(0, n);
    return this;
  }

  insert(payload: Row | Row[]) {
    this.mode = "insert";
    this.payload = payload;
    return this;
  }

  update(payload: Row) {
    this.mode = "update";
    this.payload = payload;
    return this;
  }

  upsert(payload: Row | Row[]) {
    this.mode = "upsert";
    this.payload = payload;
    return this;
  }

  delete() {
    this.mode = "delete";
    return this;
  }

  private hydrate(row: Row): Row {
    const next = { ...row };
    if (this.table === "leads") {
      next.stage = this.store.lead_stages?.find((item) => item.id === row.stage_id);
      next.lead_stages = next.stage;
      next.owner = this.store.profiles?.find((item) => item.id === row.owner_id);
      next.contact = this.store.contacts?.find((item) => item.id === row.contact_id);
    }
    if (this.table === "bookings") {
      next.contact = this.store.contacts?.find((item) => item.id === row.contact_id);
      next.package = this.store.packages?.find((item) => item.id === row.package_id);
    }
    if (this.table === "departure_travellers") {
      next.departure = this.store.departures?.find((item) => item.id === row.departure_id);
    }
    if (this.table === "departure_suppliers") {
      next.supplier = this.store.suppliers?.find((item) => item.id === row.supplier_id);
    }
    if (this.table === "social_posts") {
      next.platforms = this.store.social_post_platforms?.filter((item) => item.post_id === row.id);
    }
    if (this.table === "conversations") {
      next.contact = this.store.contacts?.find((item) => item.id === row.contact_id);
    }
    if (this.selectArg.includes("lead_stages") && this.table === "leads") {
      next.lead_stages = this.store.lead_stages?.find((item) => item.id === row.stage_id);
    }
    return next;
  }

  private execute() {
    if (this.mode === "insert") {
      const items = Array.isArray(this.payload) ? this.payload : [this.payload ?? {}];
      const created = items.map((item) => ({
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        ...item,
      }));
      this.store[this.table] = [...(this.store[this.table] ?? []), ...created];
      this.rows = created;
    }
    if (this.mode === "update") {
      const ids = new Set(this.rows.map((row) => row.id));
      this.store[this.table] = (this.store[this.table] ?? []).map((row) =>
        ids.has(row.id) ? { ...row, ...(this.payload as Row) } : row,
      );
      this.rows = (this.store[this.table] ?? []).filter((row) => ids.has(row.id));
    }
    if (this.mode === "upsert") {
      const items = Array.isArray(this.payload) ? this.payload : [this.payload ?? {}];
      for (const item of items) {
        const key = (item.provider as string) || (item.id as string);
        const existing = (this.store[this.table] ?? []).find(
          (row) => row.provider === item.provider || row.id === item.id,
        );
        if (existing) Object.assign(existing, item);
        else this.store[this.table] = [...(this.store[this.table] ?? []), { id: key ?? crypto.randomUUID(), ...item }];
      }
      this.rows = items;
    }
    if (this.mode === "delete") {
      const ids = new Set(this.rows.map((row) => row.id));
      this.store[this.table] = (this.store[this.table] ?? []).filter((row) => !ids.has(row.id));
      this.rows = [];
    }
    const data = this.rows.map((row) => this.hydrate(row));
    if (this.countHead) return { data: null, error: null, count: data.length };
    return { data, error: null, count: data.length };
  }

  maybeSingle() {
    const result = this.execute();
    const rows = result.data as Row[] | null;
    return Promise.resolve({ data: rows?.[0] ?? null, error: null });
  }

  single() {
    const result = this.execute();
    const rows = result.data as Row[] | null;
    const row = rows?.[0] ?? null;
    return Promise.resolve({ data: row, error: row ? null : { message: "not found", code: "PGRST116" } });
  }

  then<TResult1 = { data: unknown; error: unknown; count: number | null }, TResult2 = never>(
    resolve?: ((value: { data: unknown; error: unknown; count: number | null }) => TResult1 | PromiseLike<TResult1>) | null,
    reject?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return Promise.resolve(this.execute()).then(resolve, reject);
  }
}

export function createDemoClient(email: string) {
  const store = getDemoStore(email);
  return {
    from(table: string) {
      return new DemoQuery(table, store);
    },
    auth: {
      async getUser() {
        return {
          data: {
            user: { id: DEMO_OWNER_ID, email },
          },
          error: null,
        };
      },
      async signOut() {
        return { error: null };
      },
    },
    rpc: async () => ({ error: null }),
  };
}
