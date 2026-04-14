import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const sql = neon(process.env.DATABASE_URL!);
const JWT_SECRET = process.env.JWT_SECRET!;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, role, docente_id, nome_completo } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e password sono obbligatori' });
  }

  const validRoles = ['Admin', 'Docente', 'Tutor', 'Studente'];
  const ruolo = validRoles.includes(role) ? role : 'Docente';

  try {
    // Controlla se email già in uso
    const existing = await sql`
      SELECT id FROM public.utenti WHERE email = ${email.toLowerCase().trim()} LIMIT 1
    `;
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Un account con questa email esiste già' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 12);

    // Crea utente
    const newUsers = await sql`
      INSERT INTO public.utenti (email, password_hash, nome_completo, ruolo)
      VALUES (${email.toLowerCase().trim()}, ${password_hash}, ${nome_completo || null}, ${ruolo})
      RETURNING id, email, nome_completo, ruolo
    `;
    const user = newUsers[0];

    // Se è un Docente e viene fornito docente_id, collega il record
    if (ruolo === 'Docente' && docente_id) {
      await sql`
        UPDATE public.docenti
        SET utente_id = ${user.id}
        WHERE id = ${docente_id}
      `;
    }

    // Genera JWT
    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        nome_completo: user.nome_completo,
        ruolo: user.ruolo,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        nome_completo: user.nome_completo,
        ruolo: user.ruolo,
      },
    });
  } catch (err: any) {
    console.error('[Register Error]', err);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
}
