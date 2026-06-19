import { Helmet } from 'react-helmet-async';
import { useTheme } from '../context/ThemeContext';

interface SeoHeadProps {
  title?: string;
  description?: string;
  image?: string;
  path?: string;
  index?: boolean;
}

const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://girify.vercel.app';
const DEFAULT_TITLE = 'Girify — Daily Barcelona Streets Quiz';
const DEFAULT_DESCRIPTION =
  'Girify is a free daily geography quiz about Barcelona streets. Identify highlighted streets on an interactive map, earn points, climb the leaderboard, and unlock badges. A new challenge every 24 hours.';
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

const webAppSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Girify',
  url: SITE_URL,
  description: DEFAULT_DESCRIPTION,
  applicationCategory: 'Game',
  operatingSystem: 'Web',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
  inLanguage: ['en', 'es', 'ca'],
  author: { '@type': 'Organization', name: 'Girify', url: SITE_URL },
  about: {
    '@type': 'City',
    name: 'Barcelona',
    containedInPlace: { '@type': 'Country', name: 'Spain' },
  },
};

const SeoHead: React.FC<SeoHeadProps> = ({
  title,
  description,
  image,
  path = '',
  index = true,
}) => {
  const { t } = useTheme();

  const fullUrl = `${SITE_URL}${path}`;
  const metaTitle = title ? `${title} | Girify` : DEFAULT_TITLE;
  const metaDescription = description || t('appDescription') || DEFAULT_DESCRIPTION;
  const metaImage = image ? `${SITE_URL}${image}` : DEFAULT_IMAGE;
  const isHome = path === '' || path === '/';

  return (
    <Helmet>
      <title>{metaTitle}</title>
      <meta name="description" content={metaDescription} />
      <link rel="canonical" href={fullUrl} />
      {!index && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:type" content="website" />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={metaTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content="en_GB" />
      <meta property="og:site_name" content="Girify" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={metaTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />

      {isHome && <script type="application/ld+json">{JSON.stringify(webAppSchema)}</script>}
    </Helmet>
  );
};

export default SeoHead;
