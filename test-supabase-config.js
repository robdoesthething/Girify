/**
 * Quick test to verify Supabase config tables are accessible
 * Run this with: node test-supabase-config.js
 */

// Simulate Supabase query to app_config
console.log('Testing Supabase app_config access...\n');

// SQL query you should run in Supabase SQL Editor:
console.log('Run this in Supabase SQL Editor:');
console.log("SELECT * FROM app_config WHERE id = 'default';");
console.log('\nExpected result:');
console.log({
  id: 'default',
  starting_giuros: 100,
  daily_login_bonus: 50,
  daily_challenge_bonus: 100,
  streak_week_bonus: 250,
  perfect_score_bonus: 50,
  referral_bonus: 500,
});

console.log('\n\nIf you get an error like "permission denied for table app_config",');
console.log('the RLS policies may not be working correctly.');
console.log('\nTo fix, run in Supabase SQL Editor:');
console.log('GRANT SELECT ON app_config TO anon, authenticated;');
