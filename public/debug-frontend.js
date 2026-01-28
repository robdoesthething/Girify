/**
 * Frontend Debug Script
 *
 * Paste this into browser console (F12) to debug game saves and friendships
 *
 * Usage: Copy all of this code, paste into console, press Enter
 */

(async function debugFrontend() {
  console.log('%c🔍 Frontend Debug Script', 'font-size: 20px; font-weight: bold; color: #4CAF50;');
  console.log('═'.repeat(60));

  // 1. Check Firebase Auth
  console.log('\n%c1️⃣  Firebase Authentication', 'font-size: 16px; font-weight: bold;');

  try {
    const { auth } = await import('/src/firebase.ts');
    const user = auth.currentUser;

    if (!user) {
      console.error('%c❌ Not logged in!', 'color: red; font-weight: bold;');
      console.log('%c💡 Solution: Log in first', 'color: orange;');
      return;
    }

    console.log('%c✅ Logged in', 'color: green;');
    console.log('  Firebase UID:', user.uid);
    console.log('  Email:', user.email);
    console.log('  Display Name:', user.displayName || '⚠️  NOT SET');
    console.log('  Email Verified:', user.emailVerified);

    if (!user.displayName) {
      console.warn('%c⚠️  Display Name is not set!', 'color: orange; font-weight: bold;');
      console.log('%c  This means games won\'t be saved to your account.', 'color: orange;');
      console.log('%c  Set it with: await user.updateProfile({ displayName: "@yourusername" })', 'color: gray;');
    }
  } catch (err) {
    console.error('❌ Firebase error:', err);
  }

  // 2. Check Game State
  console.log('\n%c2️⃣  Game State', 'font-size: 16px; font-weight: bold;');

  try {
    // Try to get state from React DevTools global or localStorage
    const history = localStorage.getItem('girify_game_history');
    const lastPlayed = localStorage.getItem('girify_lastPlayedDate');

    if (history) {
      const games = JSON.parse(history);
      console.log('%c✅ Local game history found:', 'color: green;', games.length, 'games');
      const lastGame = games[games.length - 1];
      if (lastGame) {
        console.log('  Last game:');
        console.log('    Username:', lastGame.username || '⚠️  ANONYMOUS');
        console.log('    Score:', lastGame.score);
        console.log('    Date:', lastGame.date);
      }
    } else {
      console.log('%c⚠️  No local game history', 'color: orange;');
    }

    if (lastPlayed) {
      console.log('  Last played date:', lastPlayed);
    }
  } catch (err) {
    console.error('❌ Game state error:', err);
  }

  // 3. Test Supabase Connection
  console.log('\n%c3️⃣  Supabase Connection', 'font-size: 16px; font-weight: bold;');

  try {
    const { supabase } = await import('/src/services/supabase.ts');

    // Test read
    const { data: games, error: gamesError } = await supabase
      .from('game_results')
      .select('id, user_id, score, played_at')
      .order('played_at', { ascending: false })
      .limit(3);

    if (gamesError) {
      console.error('%c❌ Failed to read games:', 'color: red;', gamesError.message);
    } else {
      console.log('%c✅ Can read games:', 'color: green;', games?.length || 0, 'recent games');
      if (games && games.length > 0) {
        games.forEach(g => {
          console.log(`    ${g.user_id || 'anonymous'} - ${g.score} points`);
        });
      }
    }

    // Test friendships
    const { data: friendships, error: friendError } = await supabase
      .from('friendships')
      .select('*')
      .limit(5);

    if (friendError) {
      console.error('%c❌ Failed to read friendships:', 'color: red;', friendError.message);
    } else {
      console.log('%c✅ Can read friendships:', 'color: green;', friendships?.length || 0, 'found');
    }
  } catch (err) {
    console.error('❌ Supabase error:', err);
  }

  // 4. Test Game Save Function
  console.log('\n%c4️⃣  Testing Game Save', 'font-size: 16px; font-weight: bold;');

  try {
    const { insertGameResult } = await import('/src/services/db/games.ts');
    const { auth } = await import('/src/firebase.ts');
    const user = auth.currentUser;

    if (!user || !user.displayName) {
      console.warn('%c⚠️  Cannot test save: Not logged in or no displayName', 'color: orange;');
    } else {
      console.log('%c🧪 Testing game save with your username...', 'color: blue;');

      const testGame = {
        user_id: user.displayName,
        score: 999,
        time_taken: 30,
        correct_answers: 10,
        question_count: 10,
        played_at: new Date().toISOString(),
        platform: 'web',
        is_bonus: false,
      };

      console.log('  Test data:', testGame);

      const { success, error } = await insertGameResult(testGame);

      if (success) {
        console.log('%c✅ Test save SUCCESSFUL!', 'color: green; font-weight: bold;');
        console.log('%c  Games should be saving correctly.', 'color: green;');

        // Clean up test data
        const { supabase } = await import('/src/services/supabase.ts');
        await supabase
          .from('game_results')
          .delete()
          .eq('score', 999)
          .eq('user_id', user.displayName);
        console.log('  🧹 Cleaned up test data');
      } else {
        console.error('%c❌ Test save FAILED:', 'color: red; font-weight: bold;', error);
        if (error && error.code === '42501') {
          console.log('%c  💡 RLS policy issue - run: scripts/fix-rls-game-results.sql', 'color: orange;');
        } else if (error && error.code === '23503') {
          console.log('%c  💡 User doesn\'t exist in users table', 'color: orange;');
          console.log('%c     Your username:', user.displayName, 'color: gray;');
        }
      }
    }
  } catch (err) {
    console.error('❌ Save test error:', err);
  }

  // 5. Check Network Requests
  console.log('\n%c5️⃣  Monitor Network Requests', 'font-size: 16px; font-weight: bold;');
  console.log('%c  Open Network tab (F12 → Network) and look for:', 'color: gray;');
  console.log('%c  - REST calls to Supabase', 'color: gray;');
  console.log('%c  - Any failed requests (red)', 'color: gray;');
  console.log('%c  - game_results POST requests when finishing a game', 'color: gray;');

  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('%c📊 Debug Summary', 'font-size: 16px; font-weight: bold;');
  console.log('\n%cIf games are not saving:', 'font-weight: bold;');
  console.log('  1. Check Firebase displayName is set');
  console.log('  2. Check Network tab for failed requests');
  console.log('  3. Check Console for errors when game ends');
  console.log('  4. Verify username exists in users table');
  console.log('\n%cIf friendships are not working:', 'font-weight: bold;');
  console.log('  1. Check you\'re on the Friends page (/friends)');
  console.log('  2. Check Network tab for friend_requests calls');
  console.log('  3. Check Console for errors');
  console.log('  4. Verify RLS policies are applied');
  console.log('\n');
})();
