/**
 * Announcements Database Operations
 *
 * System announcements and user read tracking.
 */

import type { AnnouncementRow } from '../../types/supabase';
import { normalizeUsername } from '../../utils/format';
import { supabase } from '../supabase';

export async function getActiveAnnouncements(): Promise<AnnouncementRow[]> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('is_active', true)
    .lte('publish_date', now)
    .or(`expiry_date.is.null,expiry_date.gte.${now}`)
    .order('priority', { ascending: false })
    .order('publish_date', { ascending: false });

  if (error) {
    console.error('[DB] getActiveAnnouncements error:', error.message);
    return [];
  }

  return data || [];
}

export async function getAllAnnouncements(): Promise<AnnouncementRow[]> {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('publish_date', { ascending: false });

  if (error) {
    console.error('[DB] getAllAnnouncements error:', error.message);
    return [];
  }
  return data || [];
}

export async function createAnnouncement(
  announcement: Omit<AnnouncementRow, 'id' | 'created_at'>
): Promise<string | null> {
  const { data, error } = await supabase
    .from('announcements')
    .insert(announcement)
    .select()
    .single();

  if (error) {
    console.error('[DB] createAnnouncement error:', error.message);
    return null;
  }
  return data?.id?.toString() || null;
}

export async function updateAnnouncement(
  id: number,
  updates: Partial<AnnouncementRow>
): Promise<boolean> {
  const { error } = await supabase.from('announcements').update(updates).eq('id', id);

  if (error) {
    console.error('[DB] updateAnnouncement error:', error.message);
    return false;
  }
  return true;
}

export async function deleteAnnouncement(id: number): Promise<boolean> {
  const { error } = await supabase.from('announcements').delete().eq('id', id);

  if (error) {
    console.error('[DB] deleteAnnouncement error:', error.message);
    return false;
  }
  return true;
}

export async function getReadAnnouncementIds(username: string): Promise<number[]> {
  const normalized = normalizeUsername(username);
  const { data, error } = await supabase
    .from('user_read_announcements')
    .select('announcement_id')
    .eq('username', normalized);

  if (error) {
    console.error('[DB] getReadAnnouncementIds error:', error.message);
    return [];
  }
  return data?.map(r => r.announcement_id) || [];
}

export async function markAnnouncementAsRead(
  username: string,
  announcementId: number
): Promise<boolean> {
  const normalized = normalizeUsername(username);
  const { error } = await supabase.from('user_read_announcements').insert({
    username: normalized,
    announcement_id: announcementId,
  });

  if (error) {
    console.error('[DB] markAnnouncementAsRead error:', error.message);
    return false;
  }
  return true;
}
