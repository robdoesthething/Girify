import { updateProfile } from 'firebase/auth';
import { migrateUser } from '../utils/social';
import { USER } from '../config/constants';

export class UserMigrationService {
  /**
   * Check and perform migration if necessary
   * @param {Object} user - Firebase user object
   * @param {string} currentHandle - The effective display name to check
   * @returns {Promise<string>} The existing or new handle
   */
  static async migrateToNewFormat(user, currentHandle) {
    // If strict mode, we might trust user.displayName, but useAuth calculates it safely.
    // So we use passed currentHandle.

    if (!this.needsMigration(currentHandle)) {
      return currentHandle;
    }

    const newHandle = this.generateNewHandle(currentHandle);
    await this.performMigration(user, currentHandle, newHandle);
    return newHandle;
  }

  static needsMigration(handle) {
    if (!handle) {
      return false;
    }
    const oldFormat = USER.HANDLE_FORMATS.OLD_REGEX;
    const newFormat = USER.HANDLE_FORMATS.NEW_REGEX;
    const hasExcessiveDigits = USER.HANDLE_FORMATS.EXCESSIVE_DIGITS.test(handle);
    const isTooLong = handle.length > USER.USERNAME.MAX_LENGTH;

    return oldFormat.test(handle) || !newFormat.test(handle) || hasExcessiveDigits || isTooLong;
  }

  static generateNewHandle(handle) {
    const oldFormat = USER.HANDLE_FORMATS.OLD_REGEX;
    if (oldFormat.test(handle)) {
      return `@${handle.replace('#', '')}`;
    }

    // Fallback for invalid formats
    const randomId = Math.floor(
      USER.USERNAME.SUFFIX_MIN +
        Math.random() * (USER.USERNAME.SUFFIX_MAX - USER.USERNAME.SUFFIX_MIN + 1)
    );
    let coreName = handle.replace(/^@/, '').split(/\d/)[0];
    coreName =
      coreName.replace(/[^a-zA-Z]/g, '').slice(0, USER.USERNAME.CORE_NAME_MAX) ||
      USER.USERNAME.DEFAULT_NAME;
    return `@${coreName}${randomId}`;
  }

  static async performMigration(user, currentHandle, newHandle) {
    // eslint-disable-next-line no-console
    console.log(`[Migration] Update handle: ${currentHandle} -> ${newHandle}`);
    await updateProfile(user, { displayName: newHandle });
    await migrateUser(currentHandle, newHandle);
    // eslint-disable-next-line no-console
    console.log('[Migration] Success! New handle:', newHandle);
  }
}
