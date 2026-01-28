/**
 * Debug Utilities
 *
 * Import and use these utilities to diagnose issues with activity feeds,
 * profiles, and database connectivity.
 */

/* eslint-disable no-console */

export { checkDatabaseHealth } from './databaseDiagnostics';
export {
  testPublishDailyScore,
  clearTestActivities,
  checkActivityPermissions,
} from './testActivityPublishing';

// Make all utilities available in browser console for easy debugging
if (typeof window !== 'undefined') {
  import('./databaseDiagnostics').then(module => {
    (window as any).checkDatabaseHealth = module.checkDatabaseHealth;
  });

  import('./testActivityPublishing').then(module => {
    (window as any).testPublishDailyScore = module.testPublishDailyScore;
    (window as any).clearTestActivities = module.clearTestActivities;
    (window as any).checkActivityPermissions = module.checkActivityPermissions;
  });

  console.log('🛠️  Debug utilities loaded! Available commands:');
  console.log('   - checkDatabaseHealth(username)');
  console.log('   - testPublishDailyScore(username, score?)');
  console.log('   - clearTestActivities(username)');
  console.log('   - checkActivityPermissions()');
}
