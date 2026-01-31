import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { token } = req.query;

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Token required' });
  }

  // GET - Retrieve session
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('carousel_edit_sessions')
        .select('carousel_data, style_preset, format, username, expires_at')
        .eq('token', token)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) {
        return res.status(404).json({ error: 'Session not found or expired' });
      }

      return res.status(200).json({
        carouselData: data.carousel_data,
        stylePreset: data.style_preset,
        format: data.format,
        username: data.username,
        expiresAt: data.expires_at,
      });
    } catch (error) {
      console.error('GET error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // PUT - Update session
  if (req.method === 'PUT') {
    try {
      const { carouselData } = req.body;

      if (!carouselData) {
        return res.status(400).json({ error: 'carouselData required' });
      }

      const { error } = await supabase
        .from('carousel_edit_sessions')
        .update({ carousel_data: carouselData })
        .eq('token', token)
        .gt('expires_at', new Date().toISOString());

      if (error) {
        console.error('Update error:', error);
        return res.status(500).json({ error: 'Failed to update session' });
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('PUT error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
