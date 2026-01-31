import { supabase } from './supabase';
import type { SessionResponse, CarouselData } from '../types';

/**
 * Загрузка сессии редактирования по токену
 */
export async function getSession(token: string): Promise<SessionResponse | null> {
  const { data, error } = await supabase
    .from('carousel_edit_sessions')
    .select('carousel_data, style_preset, format, username, expires_at')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error || !data) {
    console.error('Error fetching session:', error);
    return null;
  }

  return {
    carouselData: data.carousel_data as CarouselData,
    stylePreset: data.style_preset,
    format: data.format as 'square' | 'portrait',
    username: data.username,
    expiresAt: data.expires_at,
  };
}

/**
 * Сохранение изменений в сессии
 */
export async function updateSession(token: string, carouselData: CarouselData): Promise<boolean> {
  const { error } = await supabase
    .from('carousel_edit_sessions')
    .update({ carousel_data: carouselData })
    .eq('token', token)
    .gt('expires_at', new Date().toISOString());

  if (error) {
    console.error('Error updating session:', error);
    return false;
  }

  return true;
}

/**
 * Генерация токена (используется на сервере бота)
 */
export function generateToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = '';
  for (let i = 0; i < 12; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}
