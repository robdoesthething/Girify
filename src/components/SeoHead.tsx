import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

interface SeoHeadProps {
  title?: string;
  description?: string;
  image?: string;
  path?: string;
}

const SeoHead: React.FC<SeoHeadProps> = ({ title, description, image, path = '' }) => {
  const { t } = useTranslation();

  const siteUrl = 'https://girify.com';
  const fullUrl = `${siteUrl}${path}`;
  const metaTitle = title ? `${title} | Girify` : 'Girify - Barcelona Streets Quiz';
  const metaDescription =
    description ||
    t('appDescription') ||
    'Master the streets of Barcelona with this addictive puzzle game. Daily challenges, leaderboards, and more!';
  const metaImage = image ? `${siteUrl}${image}` : `${siteUrl}/og-image.png`;

  return (
    <Helmet>
      <title>{metaTitle}</title>
      <meta name="description" content={metaDescription} />

      <meta property="og:type" content="website" />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={metaTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={metaImage} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={metaTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />
    </Helmet>
  );
};

export default SeoHead;
