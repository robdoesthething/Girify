import { updateProfile, User } from 'firebase/auth';
import { USER } from '../config/constants';
import { migrateUser } from '../utils/social';

export class UserMigrationService {
  /**
   * Check and perform migration if necessary
   */
  static async migrateToNewFormat(user: User, currentHandle: string): Promise<string> {
    if (!this.needsMigration(currentHandle)) {
      return currentHandle;
    }

    const newHandle = this.generateNewHandle(currentHandle);
    await this.performMigration(user, currentHandle, newHandle);
    return newHandle;
  }

  static needsMigration(handle: string): boolean {
    if (!handle) {
      return false;
    }
    const oldFormat = USER.HANDLE_FORMATS.OLD_REGEX;
    const newFormat = USER.HANDLE_FORMATS.NEW_REGEX;
    const hasExcessiveDigits = USER.HANDLE_FORMATS.EXCESSIVE_DIGITS.test(handle);
    const isTooLong = handle.length > USER.USERNAME.MAX_LENGTH;

    return oldFormat.test(handle) || !newFormat.test(handle) || hasExcessiveDigits || isTooLong;
  }

  static generateNewHandle(handle: string): string {
    const oldFormat = USER.HANDLE_FORMATS.OLD_REGEX;
    if (oldFormat.test(handle)) {
      return `@${handle.replace('#', '')}`;
    }

    const randomId = Math.floor(
      USER.USERNAME.SUFFIX_MIN +
        Math.random() * (USER.USERNAME.SUFFIX_MAX - USER.USERNAME.SUFFIX_MIN + 1)
    );
    let coreName = handle.replace(/^@/, '').split(/\d/)[0] ?? '';
    coreName =
      coreName.replace(/[^a-zA-Z]/g, '').slice(0, USER.USERNAME.CORE_NAME_MAX) ||
      USER.USERNAME.DEFAULT_NAME;
    return `@${coreName}${randomId}`;
  }

  static async performMigration(
    user: User,
    currentHandle: string,
    newHandle: string
  ): Promise<void> {
    console.warn(`[Migration] Update handle: ${currentHandle} -> ${newHandle}`);
    await updateProfile(user, { displayName: newHandle });
    await migrateUser(currentHandle, newHandle);
    console.warn('[Migration] Success! New handle:', newHandle);
  }
}
