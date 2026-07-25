import type { PostgrestError } from '@supabase/supabase-js';

/**
 * Produce a friendly error message for Supabase write failures.
 * Detects RLS/permission errors and suggests refresh + retry.
 */
export function describeSupabaseError(
  error: Pick<PostgrestError, 'code' | 'message'> | null | undefined,
  fallback: string
): string {
  if (!error) return fallback;
  const code = error.code ?? '';
  const msg = (error.message ?? '').toLowerCase();

  // 42501 = insufficient_privilege, PGRST301 = JWT expired, common RLS strings
  const isRls =
    code === '42501' ||
    code === 'PGRST301' ||
    msg.includes('row-level security') ||
    msg.includes('row level security') ||
    msg.includes('violates row-level') ||
    msg.includes('permission denied') ||
    msg.includes('new row violates');

  if (isRls) {
    return `${fallback}: akses ditolak oleh kebijakan keamanan. Coba muat ulang halaman dan ulangi. Jika masih gagal, pastikan Anda memiliki izin untuk data ini.`;
  }

  if (code === 'PGRST116') {
    return `${fallback}: data tidak ditemukan atau bukan milik Anda.`;
  }

  return fallback;
}
