import type { Metadata } from 'next';
import './globals.css';
import { site } from '@/data/site';
import ModalProvider from '@/components/modal-provider';
import Navigation from '@/components/navigation';
import Footer from '@/components/footer';
import { businessStructuredData, homeTitle, jsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  metadataBase: new URL(site.origin),
  title: { default: homeTitle, template: `%s | ${site.name}` },
  description: site.description,
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' } },
  verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined },
  openGraph: { title: homeTitle, description: site.description, type: 'website', siteName: site.name, locale: 'en_IN' },
  twitter: { card: 'summary', title: homeTitle, description: site.description },
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en-IN"><body><ModalProvider><Navigation />{children}<Footer /></ModalProvider><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(businessStructuredData()) }} /></body></html>;
}
