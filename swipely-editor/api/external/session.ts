import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const EDITOR_URL = process.env.EDITOR_URL || 'https://swipely-19h3.vercel.app';

const EXTERNAL_API_KEYS: Record<string, string> = {
  onetwoprime: process.env.ONETWOPRIME_API_KEY || '',
};

const MAX_SLIDES = 20;
const MAX_SLIDE_HTML_BYTES = 500_000;
const MAX_TOTAL_BYTES = 4_000_000;
const SESSION_TTL_HOURS = 24;

type ExternalSlide = {
  html: string;
  type?: string;
  title?: string;
  content?: string;
};

function generateToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = '';
  for (let i = 0; i < 12; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

function resolveClient(authHeader: string | undefined): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  if (!token) return null;
  for (const [client, key] of Object.entries(EXTERNAL_API_KEYS)) {
    if (key && token === key) return client;
  }
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const client = resolveClient(req.headers.authorization);
  if (!client) return res.status(401).json({ error: 'Unauthorized' });

  const { slides, format, meta } = req.body ?? {};

  if (!Array.isArray(slides) || slides.length === 0) {
    return res.status(400).json({ error: 'slides: non-empty array required' });
  }
  if (slides.length > MAX_SLIDES) {
    return res.status(400).json({ error: `slides: max ${MAX_SLIDES}` });
  }

  let totalBytes = 0;
  for (let i = 0; i < slides.length; i++) {
    const s = slides[i] as ExternalSlide;
    if (!s || typeof s.html !== 'string' || s.html.length === 0) {
      return res.status(400).json({ error: `slides[${i}].html: required string` });
    }
    const size = Buffer.byteLength(s.html, 'utf8');
    if (size > MAX_SLIDE_HTML_BYTES) {
      return res.status(400).json({ error: `slides[${i}].html: too large (${size} > ${MAX_SLIDE_HTML_BYTES})` });
    }
    totalBytes += size;
  }
  if (totalBytes > MAX_TOTAL_BYTES) {
    return res.status(400).json({ error: `total payload too large (${totalBytes} > ${MAX_TOTAL_BYTES})` });
  }

  const allowedFormats = ['square', 'portrait'];
  const fmt = typeof format === 'string' && allowedFormats.includes(format) ? format : 'square';

  const normalizedSlides = (slides as ExternalSlide[]).map((s) => ({
    type: typeof s.type === 'string' ? s.type : 'content',
    title: typeof s.title === 'string' ? s.title : '',
    content: typeof s.content === 'string' ? s.content : '',
    html: s.html,
  }));

  const carouselData = {
    slides: normalizedSlides,
    external: true,
    source: client,
    meta: meta && typeof meta === 'object' ? meta : null,
  };

  const token = generateToken();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + SESSION_TTL_HOURS);

  const { error } = await supabase.from('carousel_edit_sessions').insert({
    token,
    user_id: 0,
    carousel_data: carouselData,
    style_preset: '__external__',
    format: fmt,
    username: null,
    images: null,
    expires_at: expiresAt.toISOString(),
  });

  if (error) {
    console.error('[external/session] Supabase insert error:', error);
    return res.status(500).json({ error: 'Failed to create session' });
  }

  return res.status(200).json({
    token,
    editUrl: `${EDITOR_URL}/${token}`,
    expiresAt: expiresAt.toISOString(),
  });
}
