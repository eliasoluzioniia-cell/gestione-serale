/**
 * api.ts — Client di autenticazione e database per Neon
 * Sostituisce @supabase/supabase-js per il progetto.
 *
 * Gestisce:
 * - Autenticazione (login, logout, register, sessione corrente)
 * - Storage del JWT in localStorage
 * - Listener per cambiamenti di stato auth (compatibile con pattern Supabase)
 */

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

// ——— Tipi ———

export interface UserProfile {
  id: string;
  email: string;
  nome_completo: string | null;
  ruolo: 'Admin' | 'Docente' | 'Tutor' | 'Studente';
}

export interface Session {
  token: string;
  user: UserProfile;
  /** Compatibilità: accesso a user.id tramite session.user.id */
}

type AuthChangeEvent = 'SIGNED_IN' | 'SIGNED_OUT';
type AuthChangeCallback = (event: AuthChangeEvent, session: Session | null) => void;

// ——— Storage ———

const TOKEN_KEY = 'neon_auth_token';

function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// ——— Listeners (pattern compatibile con Supabase) ———

const authListeners: AuthChangeCallback[] = [];

function notifyListeners(event: AuthChangeEvent, session: Session | null) {
  authListeners.forEach((cb) => cb(event, session));
}

// ——— Sessione in memoria ———
let currentSession: Session | null = null;

// ——— Funzioni Auth ———

/**
 * Recupera la sessione corrente (dal token in localStorage)
 */
async function getSession(): Promise<{ data: { session: Session | null } }> {
  const token = getToken();
  if (!token) {
    currentSession = null;
    return { data: { session: null } };
  }

  // Verifica token con il backend
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      clearToken();
      currentSession = null;
      return { data: { session: null } };
    }

    const { user } = await res.json();
    currentSession = { token, user };
    return { data: { session: currentSession } };
  } catch {
    clearToken();
    currentSession = null;
    return { data: { session: null } };
  }
}

/**
 * Login con email e password
 */
async function signInWithPassword(credentials: {
  email: string;
  password: string;
}): Promise<{ error: { message: string } | null }> {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    const data = await res.json();

    if (!res.ok) {
      return { error: { message: data.error || 'Errore di autenticazione' } };
    }

    saveToken(data.token);
    currentSession = { token: data.token, user: data.user };
    notifyListeners('SIGNED_IN', currentSession);
    return { error: null };
  } catch (err: any) {
    return { error: { message: err.message || 'Errore di rete' } };
  }
}

/**
 * Registrazione nuovo account
 */
async function signUp(options: {
  email: string;
  password: string;
  options?: {
    data?: {
      role?: string;
      docente_id?: string | null;
      full_name?: string;
      nome_completo?: string;
    };
  };
}): Promise<{
  data: { session: Session | null; user: UserProfile | null };
  error: { message: string } | null;
}> {
  try {
    const metadata = options.options?.data || {};
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: options.email,
        password: options.password,
        role: metadata.role || 'Docente',
        docente_id: metadata.docente_id || null,
        nome_completo: metadata.full_name || metadata.nome_completo || null,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { data: { session: null, user: null }, error: { message: data.error } };
    }

    saveToken(data.token);
    currentSession = { token: data.token, user: data.user };
    notifyListeners('SIGNED_IN', currentSession);
    return { data: { session: currentSession, user: data.user }, error: null };
  } catch (err: any) {
    return {
      data: { session: null, user: null },
      error: { message: err.message || 'Errore di rete' },
    };
  }
}

/**
 * Logout
 */
async function signOut(): Promise<void> {
  clearToken();
  currentSession = null;
  notifyListeners('SIGNED_OUT', null);
}

/**
 * Listener per cambiamenti di stato auth — compatibile con Supabase API
 */
function onAuthStateChange(callback: AuthChangeCallback): {
  data: { subscription: { unsubscribe: () => void } };
} {
  authListeners.push(callback);
  return {
    data: {
      subscription: {
        unsubscribe: () => {
          const idx = authListeners.indexOf(callback);
          if (idx !== -1) authListeners.splice(idx, 1);
        },
      },
    },
  };
}

/**
 * Recupera l'utente corrente dal token (senza chiamata al server)
 */
function getUser(): UserProfile | null {
  return currentSession?.user || null;
}

// ——— Funzioni DB (semplificato per fetch alle API Routes) ———

/**
 * Client database — compatibile con pattern Supabase .from().select()...
 * Ogni chiamata si traduce in una richiesta alle Vercel API Routes
 */
function from(table: string) {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  let selectCols = '*';
  const eqFilters: string[] = [];
  const isFilters: string[] = [];
  let orderClause = '';
  let limitClause = '';
  let singleMode = false;

  const builder = {
    select(cols: string) {
      selectCols = cols;
      return builder;
    },
    eq(col: string, val: any) {
      eqFilters.push(`eq=${col}:${val}`);
      return builder;
    },
    is(col: string, _val: null) {
      isFilters.push(`is=${col}:null`);
      return builder;
    },
    order(col: string, opts?: { ascending?: boolean }) {
      orderClause = `order=${col}:${opts?.ascending === false ? 'desc' : 'asc'}`;
      return builder;
    },
    limit(n: number) {
      limitClause = `limit=${n}`;
      return builder;
    },
    maybeSingle() {
      singleMode = true;
      return builder;
    },
    single() {
      singleMode = true;
      return builder;
    },

    // Esegui la query GET
    async then(resolve: (v: any) => void, reject?: (e: any) => void) {
      const params = new URLSearchParams({ select: selectCols });
      eqFilters.forEach((f) => params.append('eq', f.replace('eq=', '')));
      isFilters.forEach((f) => params.append('is', f.replace('is=', '')));
      if (orderClause) params.append('order', orderClause.replace('order=', ''));
      if (limitClause) params.append('limit', limitClause.replace('limit=', ''));
      if (singleMode) params.append('single', 'true');

      try {
        const res = await fetch(`${API_BASE}/data/${table}?${params.toString()}`, { headers });
        const data = await res.json();
        if (!res.ok) resolve({ data: null, error: data });
        else resolve({ data, error: null });
      } catch (err) {
        if (reject) reject(err);
        else resolve({ data: null, error: err });
      }
    },

    // INSERT
    async insert(rows: any | any[]) {
      const arr = Array.isArray(rows) ? rows : [rows];
      const results: any[] = [];
      for (const row of arr) {
        const res = await fetch(`${API_BASE}/data/${table}`, {
          method: 'POST',
          headers,
          body: JSON.stringify(row),
        });
        const data = await res.json();
        if (!res.ok) return { data: null, error: data };
        results.push(data);
      }
      return {
        data: results,
        error: null,
        select() {
          return { data: results, error: null, single: () => ({ data: results[0], error: null }) };
        },
        single() {
          return { data: results[0], error: null };
        },
      };
    },

    // UPSERT (insert or update on conflict)
    async upsert(rows: any | any[], _opts?: any) {
      // Per semplicità, usa insert via API (la API usa INSERT ... ON CONFLICT se configurato)
      // Nella pratica, il backend gestisce l'upsert tramite query SQL specifiche
      const arr = Array.isArray(rows) ? rows : [rows];
      const results: any[] = [];
      for (const row of arr) {
        const res = await fetch(`${API_BASE}/data/${table}`, {
          method: 'POST',
          headers,
          body: JSON.stringify(row),
        });
        const data = await res.json();
        if (!res.ok) return { data: null, error: data };
        results.push(data);
      }
      return { 
        data: results, 
        error: null,
        select() {
          return { data: results, error: null, single: () => ({ data: results[0], error: null }) };
        },
        single() {
          return { data: results[0], error: null };
        },
      };
    },

    // UPDATE
    async update(updates: any) {
      let recordId: string | null = null;
      eqFilters.map((f) => {
        const val = f.replace('eq=', '').split(':');
        if (val[0] === 'id') recordId = val[1];
        return val;
      });

      if (!recordId) return { data: null, error: { message: 'ID richiesto per update' } };

      const res = await fetch(`${API_BASE}/data/${table}?id=${recordId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok) return { data: null, error: data };
      return {
        data,
        error: null,
        select() {
          return { data, error: null, single: () => ({ data, error: null }) };
        },
        single() {
          return { data, error: null };
        },
      };
    },

    // DELETE
    async delete() {
      const eqId = eqFilters.find((f) => f.includes('id:'));
      const id = eqId?.replace('eq=id:', '');
      if (!id) return { error: { message: 'ID richiesto per delete' } };

      const res = await fetch(`${API_BASE}/data/${table}?id=${id}`, { method: 'DELETE', headers });
      if (!res.ok) {
        const data = await res.json();
        return { error: data };
      }
      return { error: null };
    },

    // In() filter — non completamente supportato nel proxy generico
    // Le query complesse vanno nelle API routes dedicate
    in(_col: string, _values: any[]) {
      console.warn('Filter .in() non completamente supportato nel client generico');
      return builder;
    },

    filter(_col: string, _op: string, _val: any) {
      console.warn('.filter() non completamente supportato nel client generico');
      return builder;
    },
  };

  return builder;
}

// ——— Export — API compatibile con Supabase ———

export const api = {
  auth: {
    getSession,
    signInWithPassword,
    signUp,
    signOut,
    onAuthStateChange,
    getUser,
  },
  from,
  /** Compatibilità: funzioni di edge non più usate */
  functions: {
    invoke: async (name: string, _opts?: any) => {
      console.warn(`supabase.functions.invoke('${name}') non supportato. Usa le API Routes.`);
      return { data: null, error: { message: 'Edge functions non disponibili. Usa API Routes.' } };
    },
  },
};

// Compatibilità diretta: export named "supabase" per file che importano solo il db client
export const supabase = api;
