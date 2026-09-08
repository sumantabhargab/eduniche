import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://padhaishuru.com'

  const publicRoutes = [
    '',
    '/login',
    '/pricing',
    '/pyqs',
    '/pyqs/cs',
    '/pyqs/ec',
    '/pyqs/ee',
    '/pyqs/me',
    '/pyqs/in',
    '/gate',
    '/formulas',
    '/cutoffs',
    '/leaderboard',
    '/how-it-works',
    '/terms',
    '/privacy',
    '/referral',
  ]

  return publicRoutes.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '' ? 'daily' : 'weekly',
    priority: path === '' ? 1.0 : 0.7,
  }))
}
