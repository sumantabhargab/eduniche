import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/dashboard/', '/chat/', '/success/', '/profile/'],
      },
    ],
    sitemap: 'https://padhaishuru.com/sitemap.xml',
  }
}
