import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const BOT_SECRET = process.env.EDITOR_BOT_SECRET;
const EDITOR_URL = process.env.EDITOR_URL || 'https://swipely-19h3.vercel.app';

function generateToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = '';
  for (let i = 0; i < 12; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // POST - Create session
  if (req.method === 'POST') {
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${BOT_SECRET}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const { userId, carouselData, stylePreset, format, username } = req.body;

      if (!userId || !carouselData || !stylePreset) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const token = generateToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const { error } = await supabase.from('carousel_edit_sessions').insert({
        token,
        user_id: userId,
        carousel_data: carouselData,
        style_preset: stylePreset,
        format: format || 'portrait',
        username: username || null,
        expires_at: expiresAt.toISOString(),
      });

      if (error) {
        console.error('Supabase insert error:', error);
        return res.status(500).json({ error: 'Failed to create session' });
      }

      return res.status(200).json({
        token,
        editUrl: `${EDITOR_URL}/${token}`,
        expiresAt: expiresAt.toISOString(),
      });
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
