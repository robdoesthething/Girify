/**
 * Test Activity Publishing
 *
 * Manual test utility to verify activity publishing works correctly
 * Run in browser console after importing
 */

/* eslint-disable no-console */

import { supabase } from '../../services/supabase';
import { normalizeUsername } from '../format';
import { publishActivity } from '../social/publishActivity';

/**
 * Test publishing a daily score activity
 */
export async function testPublishDailyScore(username: string, score: number = 1000): Promise<void> {
  console.log(`\n🧪 Testing Activity Publishing for ${username}\n`);
  console.log('━'.repeat(60));

  const normalized = normalizeUsername(username);
  console.log(`1️⃣  Normalized username: ${normalized}`);

  try {
    // Publish test activity
    console.log(`2️⃣  Publishing test activity (daily_score: ${score})...`);
    await publishActivity(normalized, 'daily_score', {
      score,
      time: 15.5,
    });
    console.log('✅ Activity published successfully');

    // Wait a moment for DB to update
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify it was saved
    console.log(`3️⃣  Verifying activity was saved...`);
    const { data, error } = await supabase
      .from('activity_feed')
      .select('*')
      .eq('username', normalized)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('❌ Error fetching activity:', error.message);
      return;
    }

    if (!data || data.length === 0) {
      console.error('❌ No activities found! Activity was not saved.');
      console.log('   This indicates a database permissions issue.');
      console.log('   Run scripts/fix-supabase-permissions.sql');
      return;
    }

    console.log(`✅ Found ${data.length} activities in database`);
    console.log('\nLatest activities:');
    data.forEach((activity, i) => {
      console.log(
        `  ${i + 1}. ${activity.type} - Score: ${activity.score || 'N/A'} - ${activity.created_at ? new Date(activity.created_at).toLocaleString() : 'N/A'}`
      );
    });

    console.log('\n━'.repeat(60));
    console.log('✨ Test completed successfully!');
  } catch (err) {
    console.error('❌ Test failed:', err);
    console.log('\n━'.repeat(60));
  }
}

/**
 * Clear test activities (cleanup)
 */
export async function clearTestActivities(username: string): Promise<void> {
  console.log(`\n🧹 Clearing test activities for ${username}\n`);

  const normalized = normalizeUsername(username);

  const { error } = await supabase
    .from('activity_feed')
    .delete()
    .eq('username', normalized)
    .eq('type', 'daily_score');

  if (error) {
    console.error('❌ Error clearing activities:', error.message);
    return;
  }

  console.log('✅ Test activities cleared');
}

/**
 * Check if RLS policies allow activity publishing
 */
export async function checkActivityPermissions(): Promise<void> {
  console.log('\n🔐 Checking Activity Feed Permissions\n');
  console.log('━'.repeat(60));

  // Test SELECT
  console.log('1️⃣  Testing SELECT permission...');
  const { error: selectError } = await supabase.from('activity_feed').select('*').limit(1);

  if (selectError) {
    console.error('❌ SELECT failed:', selectError.message);
  } else {
    console.log('✅ SELECT works');
  }

  // Test INSERT
  console.log('2️⃣  Testing INSERT permission...');
  const testActivity = {
    username: 'test_user',
    type: 'daily_score',
    score: 999,
    time_taken: 10,
    created_at: new Date().toISOString(),
  };

  const { error: insertError } = await supabase.from('activity_feed').insert(testActivity);

  if (insertError) {
    console.error('❌ INSERT failed:', insertError.message);
    console.log('   Run scripts/fix-supabase-permissions.sql to fix');
  } else {
    console.log('✅ INSERT works');
    // Clean up test
    await supabase.from('activity_feed').delete().eq('username', 'test_user');
  }

  console.log('\n━'.repeat(60));
}

// Make functions available in console
if (typeof window !== 'undefined') {
  (window as any).testPublishDailyScore = testPublishDailyScore;
  (window as any).clearTestActivities = clearTestActivities;
  (window as any).checkActivityPermissions = checkActivityPermissions;
}
