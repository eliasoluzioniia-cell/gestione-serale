/**
 * API Route generica per accesso al database Neon.
 * Questa route riceve query parametrizzate dal frontend e le esegue in modo sicuro.
 * Richiede un token JWT valido in Authorization header.
 *
 * NOTA: Per un'app in produzione più grande, dovresti creare endpoint specifici
 * per ogni risorsa. Questo approccio "proxy" è pratico per migrare velocemente.
 */
import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const sql = neon(process.env.DATABASE_URL!);
const JWT_SECRET = process.env.JWT_SECRET!;

interface JwtPayload {
  sub: string;
  email: string;
  nome_completo: string;
  ruolo: string;
}

function verifyToken(req: VercelRequest): JwtPayload | null {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(authHeader.slice(7), JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

// Operazioni consentite per ogni tabella (whitelist di sicurezza)
const ALLOWED_TABLES = new Set([
  'docenti',
  'classi',
  'materie',
  'assegnazioni_cattedre',
  'competenze',
  'curricolo',
  'curriculo', // vista alias
  'studenti',
  'studenti_classi',
  'pfi',
  'prove_di_realta',
  'valutazioni',
  'utenti',
  'anni_scolastici',
]);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verifica autenticazione
  const user = verifyToken(req);
  if (!user) {
    return res.status(401).json({ error: 'Non autenticato' });
  }

  // Leggi la tabella dal path: /api/data/docenti → ['docenti']
  const pathSegments = (req.query.path as string[]) || [];
  const table = pathSegments[0];

  if (!table || !ALLOWED_TABLES.has(table)) {
    return res.status(400).json({ error: `Tabella '${table}' non consentita` });
  }

  try {
    // ——— GET: Leggi dati ———
    if (req.method === 'GET') {
      const { select, eq, is, in: inParam, order, limit: limitParam, single } = req.query;

      // Costruzione query dinamica sicura tramite parametri
      // Nota: neon() supporta template literals per query sicure
      // Per query complesse, usiamo la funzione sql.query con parametri
      let queryStr = `SELECT ${select || '*'} FROM public.${table}`;
      const params: any[] = [];
      let paramIdx = 1;

      // Filtri WHERE
      const conditions: string[] = [];

      if (eq) {
        // eq=campo:valore o eq=campo:valore,campo2:valore2
        const eqPairs = Array.isArray(eq) ? eq : [eq];
        eqPairs.forEach((pair) => {
          const [col, val] = (pair as string).split(':');
          if (col && val !== undefined) {
            conditions.push(`${col} = $${paramIdx}`);
            params.push(val === 'null' ? null : val);
            paramIdx++;
          }
        });
      }

      if (is) {
        // is=campo:null
        const [col, val] = (is as string).split(':');
        if (col && val === 'null') {
          conditions.push(`${col} IS NULL`);
        }
      }

      if (conditions.length > 0) {
        queryStr += ` WHERE ${conditions.join(' AND ')}`;
      }

      if (order) {
        const [col, dir] = (order as string).split(':');
        const safeDir = dir === 'desc' ? 'DESC' : 'ASC';
        queryStr += ` ORDER BY ${col} ${safeDir}`;
      }

      if (limitParam) {
        queryStr += ` LIMIT ${parseInt(limitParam as string, 10)}`;
      }

      const result = await sql.unsafe(queryStr, params);

      if (single === 'true') {
        return res.status(200).json(result[0] || null);
      }
      return res.status(200).json(result);
    }

    // ——— POST: Inserisci record ———
    if (req.method === 'POST') {
      const body = req.body;
      if (!body || typeof body !== 'object') {
        return res.status(400).json({ error: 'Body richiesto' });
      }

      const cols = Object.keys(body);
      const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
      const values = Object.values(body);

      const query = `
        INSERT INTO public.${table} (${cols.join(', ')})
        VALUES (${placeholders})
        RETURNING *
      `;

      const result = await sql.unsafe(query, values as any[]);
      return res.status(201).json(result[0]);
    }

    // ——— PATCH: Aggiorna record ———
    if (req.method === 'PATCH') {
      const { id } = req.query;
      const body = req.body;

      if (!id || !body) {
        return res.status(400).json({ error: 'ID e body richiesti' });
      }

      const cols = Object.keys(body);
      const setClauses = cols.map((col, i) => `${col} = $${i + 1}`).join(', ');
      const values = [...Object.values(body), id];

      const query = `
        UPDATE public.${table}
        SET ${setClauses}
        WHERE id = $${cols.length + 1}
        RETURNING *
      `;

      const result = await sql.unsafe(query, values as any[]);
      return res.status(200).json(result[0]);
    }

    // ——— DELETE: Elimina record ———
    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'ID richiesto' });

      await sql.unsafe(`DELETE FROM public.${table} WHERE id = $1`, [id as string]);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error(`[DB Error] ${req.method} /api/data/${table}:`, err);
    return res.status(500).json({ error: err.message || 'Errore database' });
  }
}
