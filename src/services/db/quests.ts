/**
 * Quests Database Operations
 *
 * Daily quests and challenges.
 */

import type { QuestRow } from '../../types/supabase';
import { supabase } from '../supabase';

export async function getActiveQuests(): Promise<QuestRow[]> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('quests')
    .select('*')
    .eq('is_active', true)
    .or(`active_date.is.null,active_date.eq.${today}`);

  if (error) {
    console.error('[DB] getActiveQuests error:', error.message);
    return [];
  }
  return data || [];
}

export async function getTodaysQuest(): Promise<QuestRow | null> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('quests')
    .select('*')
    .eq('is_active', true)
    .eq('active_date', today ?? '')
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('[DB] getTodaysQuest error:', error.message);
    return null;
  }
  return data;
}

export async function getAllQuests(): Promise<QuestRow[]> {
  const { data, error } = await supabase
    .from('quests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[DB] getAllQuests error:', error.message);
    return [];
  }
  return data || [];
}

export async function createQuest(
  quest: Omit<QuestRow, 'id' | 'created_at'>
): Promise<string | null> {
  const { data, error } = await supabase.from('quests').insert(quest).select().single();

  if (error) {
    console.error('[DB] createQuest error:', error.message);
    return null;
  }
  return data?.id?.toString() || null;
}

export async function updateQuest(id: number, updates: Partial<QuestRow>): Promise<boolean> {
  const { error } = await supabase.from('quests').update(updates).eq('id', id);

  if (error) {
    console.error('[DB] updateQuest error:', error.message);
    return false;
  }
  return true;
}

export async function deleteQuest(id: number): Promise<boolean> {
  const { error } = await supabase.from('quests').delete().eq('id', id);

  if (error) {
    console.error('[DB] deleteQuest error:', error.message);
    return false;
  }
  return true;
}
