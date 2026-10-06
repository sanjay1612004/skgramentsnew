import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { collections } from '@/data/collections';
import CollectionPage from '@/components/collection-page';
import { site } from '@/data/site';
import { jsonLd, pageMetadata } from '@/lib/seo';
export function generateStaticParams(){return collections.map(c=>({slug:c.slug}))}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const {slug}=await params;const c=collections.find(c=>c.slug===slug);if(!c)return {};return pageMetadata(`${c.name.charAt(0)}${c.name.slice(1).toLowerCase()} T-Shirts — Bulk & Wholesale Enquiries`, `${c.description} Explore styles for bulk T-shirt orders and wholesale enquiries from SK GARMENTS, Tiruppur.`, `/collections/${slug}/`);}
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const c=collections.find(c=>c.slug===slug);if(!c)notFound();return <CollectionPage collection={c}/>}