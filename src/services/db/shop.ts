/**
 * Shop Database Operations
 *
 * Shop items, badges, and achievements.
 */

import type {
  AchievementRow,
  BadgeStatsRow,
  BadgeStatsUpdate,
  ShopItemRow,
} from '../../types/supabase';
import { supabase } from '../supabase';

// ============================================================================
// BADGE STATS
// ============================================================================

export async function getBadgeStats(username: string): Promise<BadgeStatsRow | null> {
  const { data, error } = await supabase
    .from('badge_stats')
    .select('*')
    .eq('username', username.toLowerCase())
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('[DB] getBadgeStats error:', error.message);
    return null;
  }
  return data;
}

export async function upsertBadgeStats(
  username: string,
  stats: BadgeStatsUpdate
): Promise<boolean> {
  const { error } = await supabase
    .from('badge_stats')
    .upsert({ username: username.toLowerCase(), ...stats }, { onConflict: 'username' });

  if (error) {
    console.error('[DB] upsertBadgeStats error:', error.message);
    return false;
  }
  return true;
}

// ============================================================================
// SHOP ITEMS
// ============================================================================

export async function getShopItems(): Promise<ShopItemRow[]> {
  const { data, error } = await supabase
    .from('shop_items')
    .select('*')
    .eq('is_active', true)
    .order('type')
    .order('cost');

  if (error) {
    console.error('[DB] getShopItems error:', error.message);
    return [];
  }
  return data || [];
}

export async function getShopItemById(id: string): Promise<ShopItemRow | null> {
  const { data, error } = await supabase.from('shop_items').select('*').eq('id', id).single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('[DB] getShopItemById error:', error.message);
    return null;
  }
  return data;
}

export async function createShopItem(item: ShopItemRow): Promise<boolean> {
  const { error } = await supabase.from('shop_items').insert(item);

  if (error) {
    console.error('[DB] createShopItem error:', error.message);
    return false;
  }
  return true;
}

export async function updateShopItem(id: string, updates: Partial<ShopItemRow>): Promise<boolean> {
  const { error } = await supabase.from('shop_items').update(updates).eq('id', id);

  if (error) {
    console.error('[DB] updateShopItem error:', error.message);
    return false;
  }
  return true;
}

export async function deleteShopItem(id: string): Promise<boolean> {
  const { error } = await supabase.from('shop_items').delete().eq('id', id);

  if (error) {
    console.error('[DB] deleteShopItem error:', error.message);
    return false;
  }
  return true;
}

// ============================================================================
// ACHIEVEMENTS
// ============================================================================

export async function getAchievements(): Promise<AchievementRow[]> {
  const { data, error } = await supabase
    .from('achievements')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  if (error) {
    console.error('[DB] getAchievements error:', error.message);
    return [];
  }
  return data || [];
}

export async function getAchievementById(id: string): Promise<AchievementRow | null> {
  const { data, error } = await supabase.from('achievements').select('*').eq('id', id).single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('[DB] getAchievementById error:', error.message);
    return null;
  }
  return data;
}

export async function createAchievement(achievement: AchievementRow): Promise<boolean> {
  const { error } = await supabase.from('achievements').insert(achievement);

  if (error) {
    console.error('[DB] createAchievement error:', error.message);
    return false;
  }
  return true;
}

export async function updateAchievement(
  id: string,
  updates: Partial<AchievementRow>
): Promise<boolean> {
  const { error } = await supabase.from('achievements').update(updates).eq('id', id);

  if (error) {
    console.error('[DB] updateAchievement error:', error.message);
    return false;
  }
  return true;
}

export async function deleteAchievement(id: string): Promise<boolean> {
  const { error } = await supabase.from('achievements').delete().eq('id', id);

  if (error) {
    console.error('[DB] deleteAchievement error:', error.message);
    return false;
  }
  return true;
}

// ============================================================================
// PURCHASED BADGES
// ============================================================================

export async function getUserPurchasedBadges(username: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('purchased_badges')
    .select('badge_id')
    .eq('username', username.toLowerCase());

  if (error) {
    console.error('[DB] getUserPurchasedBadges error:', error.message);
    return [];
  }
  return data?.map(b => b.badge_id) || [];
}

export async function addPurchasedBadge(username: string, badgeId: string): Promise<boolean> {
  const { error } = await supabase.from('purchased_badges').insert({
    username: username.toLowerCase(),
    badge_id: badgeId,
  });

  if (error) {
    console.error('[DB] addPurchasedBadge error:', error.message);
    return false;
  }
  return true;
}
