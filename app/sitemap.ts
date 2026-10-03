import type { MetadataRoute } from 'next';
import { products } from '@/data/products';
import { collections } from '@/data/collections';
import { site } from '@/data/site';
export const dynamic = 'force-static';
export default function sitemap():MetadataRoute.Sitemap{return [{url:site.origin,changeFrequency:'monthly',priority:1},...products.map(p=>({url:`${site.origin}/products/${p.slug}/`,changeFrequency:'monthly' as const,priority:.8})),...collections.map(c=>({url:`${site.origin}/collections/${c.slug}/`,changeFrequency:'monthly' as const,priority:.8}))]}