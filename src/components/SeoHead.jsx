import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

const SeoHead = ({ title, description, image, path = '' }) => {
  const { t } = useTranslation();

  const siteUrl = 'https://girify.com'; // Replace with actual if known, or relative
  const fullUrl = `${siteUrl}${path}`;
  const metaTitle = title ? `${title} | Girify` : 'Girify - Barcelona Streets Quiz';
  const metaDescription =
    description ||
    t('appDescription') ||
    'Master the streets of Barcelona with this addictive puzzle game. Daily challenges, leaderboards, and more!';
  const metaImage = image ? `${siteUrl}${image}` : `${siteUrl}/og-image.png`; // Fallback image

  return (
    <Helmet>
      {/* Visual */}
      <title>{metaTitle}</title>
      <meta name="description" content={metaDescription} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={metaTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={metaImage} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={metaTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />
    </Helmet>
  );
};

export default SeoHead;
