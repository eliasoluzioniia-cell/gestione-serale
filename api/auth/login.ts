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

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e password sono obbligatori' });
  }

  try {
    // Cerca l'utente per email
    const users = await sql`
      SELECT id, email, password_hash, nome_completo, ruolo
      FROM public.utenti
      WHERE email = ${email.toLowerCase().trim()}
      LIMIT 1
    `;

    if (users.length === 0) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }

    const user = users[0];

    // Verifica password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }

    // Aggiorna last_login
    await sql`
      UPDATE public.utenti SET last_login = now() WHERE id = ${user.id}
    `;

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

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        nome_completo: user.nome_completo,
        ruolo: user.ruolo,
      },
    });
  } catch (err: any) {
    console.error('[Login Error]', err);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
}
