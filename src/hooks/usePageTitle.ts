import { useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

const BASE_TITLE = 'Girify - Barcelona Streets Quiz';

/**
 * Keep document.title in sync with the current route so browser tabs and
 * history entries are distinguishable. The home route is owned by
 * SeoHead/Helmet (landing page), so it is left untouched here.
 */
export function usePageTitle(pathname: string): void {
  const { t } = useTheme();

  useEffect(() => {
    const segment = pathname.split('/')[1] || '';
    if (!segment) {
      document.title = BASE_TITLE;
      return;
    }

    const titles: Record<string, string> = {
      leaderboard: t('leaderboard') || 'Leaderboard',
      settings: t('settings') || 'Settings',
      friends: t('friends') || 'Friends',
      shop: t('shop') || 'Shop',
      about: t('about') || 'About',
      news: t('news') || 'News',
      feedback: t('feedback') || 'Feedback',
      profile: t('myProfile') || 'My Profile',
      u: t('profile') || 'Profile',
      user: t('profile') || 'Profile',
      privacy: t('privacy') || 'Privacy',
      terms: t('terms') || 'Terms',
      admin: 'Admin',
    };

    const label = titles[segment];
    document.title = label ? `${label} · Girify` : BASE_TITLE;
  }, [pathname, t]);
}
