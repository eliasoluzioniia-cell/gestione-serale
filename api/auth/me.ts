import jwt from 'jsonwebtoken';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const JWT_SECRET = process.env.JWT_SECRET!;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token mancante' });
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    return res.status(200).json({
      user: {
        id: payload.sub,
        email: payload.email,
        nome_completo: payload.nome_completo,
        ruolo: payload.ruolo,
      },
    });
  } catch (err) {
    return res.status(401).json({ error: 'Token non valido o scaduto' });
  }
}
