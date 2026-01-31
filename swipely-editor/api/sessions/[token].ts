import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export default async function handler(req: Request) {
  // Extract token from URL
  const url = new URL(req.url);
  const pathParts = url.pathname.split('/');
  const token = pathParts[pathParts.length - 1];

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (!token) {
    return new Response(JSON.stringify({ error: 'Token required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
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
        return new Response(JSON.stringify({ error: 'Session not found or expired' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      return new Response(
        JSON.stringify({
          carouselData: data.carousel_data,
          stylePreset: data.style_preset,
          format: data.format,
          username: data.username,
          expiresAt: data.expires_at,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    } catch (error) {
      console.error('GET error:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  }

  // PUT - Update session
  if (req.method === 'PUT') {
    try {
      const body = await req.json();
      const { carouselData } = body;

      if (!carouselData) {
        return new Response(JSON.stringify({ error: 'carouselData required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      const { error } = await supabase
        .from('carousel_edit_sessions')
        .update({ carousel_data: carouselData })
        .eq('token', token)
        .gt('expires_at', new Date().toISOString());

      if (error) {
        console.error('Update error:', error);
        return new Response(JSON.stringify({ error: 'Failed to update session' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    } catch (error) {
      console.error('PUT error:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

export const config = {
  runtime: 'edge',
};
