import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const sql = neon(process.env.DATABASE_URL!);
const JWT_SECRET = process.env.JWT_SECRET!;

// Verifica che il richiedente sia Admin o Tutor
function verifyAdmin(req: VercelRequest): { id: string; ruolo: string } | null {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const payload = jwt.verify(authHeader.slice(7), JWT_SECRET) as any;
    if (payload.ruolo !== 'Admin' && payload.ruolo !== 'Tutor') return null;
    return payload;
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const caller = verifyAdmin(req);
  if (!caller) {
    return res.status(403).json({ error: 'Accesso negato. Richiesto ruolo Admin o Tutor.' });
  }

  // GET /api/auth/users — Lista tutti gli utenti
  if (req.method === 'GET') {
    try {
      const users = await sql`
        SELECT id, email, nome_completo, ruolo, created_at, last_login
        FROM public.utenti
        ORDER BY ruolo, cognome_sort
      `;
      return res.status(200).json(users);
    } catch {
      // Fallback senza colonna inesistente
      const users = await sql`
        SELECT id, email, nome_completo, ruolo, created_at, last_login
        FROM public.utenti
        ORDER BY ruolo, nome_completo
      `;
      return res.status(200).json(users);
    }
  }

  // POST /api/auth/users — Crea nuovo utente (admin)
  if (req.method === 'POST') {
    const { email, fullName, password, role } = req.body;
    if (!email || !fullName) {
      return res.status(400).json({ error: 'Email e nome completo sono obbligatori' });
    }

    const validRoles = ['Admin', 'Docente', 'Tutor', 'Studente'];
    const ruolo = validRoles.includes(role) ? role : 'Docente';
    const rawPassword = password || 'TempPass123!';
    const password_hash = await bcrypt.hash(rawPassword, 12);

    try {
      const existing = await sql`
        SELECT id FROM public.utenti WHERE email = ${email.toLowerCase().trim()} LIMIT 1
      `;
      if (existing.length > 0) {
        return res.status(409).json({ error: 'Email già registrata' });
      }

      const newUser = await sql`
        INSERT INTO public.utenti (email, password_hash, nome_completo, ruolo)
        VALUES (${email.toLowerCase().trim()}, ${password_hash}, ${fullName}, ${ruolo})
        RETURNING id, email, nome_completo, ruolo
      `;
      return res.status(201).json(newUser[0]);
    } catch (err: any) {
      console.error('[Create User Error]', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // PATCH /api/auth/users — Aggiorna ruolo utente
  if (req.method === 'PATCH') {
    const { id, ruolo } = req.body;
    const validRoles = ['Admin', 'Docente', 'Tutor', 'Studente'];
    if (!id || !validRoles.includes(ruolo)) {
      return res.status(400).json({ error: 'ID e ruolo valido richiesti' });
    }

    try {
      await sql`UPDATE public.utenti SET ruolo = ${ruolo} WHERE id = ${id}`;
      return res.status(200).json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // DELETE /api/auth/users?id=... — Elimina utente
  if (req.method === 'DELETE') {
    const id = req.query.id as string;
    if (!id) return res.status(400).json({ error: 'ID richiesto' });

    try {
      await sql`DELETE FROM public.utenti WHERE id = ${id}`;
      return res.status(200).json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
