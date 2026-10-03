import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { collections } from '@/data/collections';
import CollectionPage from '@/components/collection-page';
export function generateStaticParams(){return collections.map(c=>({slug:c.slug}))}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const {slug}=await params;const c=collections.find(c=>c.slug===slug);if(!c)return {};return {title:`${c.name} — ${c.title}`,description:c.description,alternates:{canonical:`/collections/${slug}/`},openGraph:{title:`${c.name} | SK GARMENTS`,description:c.description,url:`/collections/${slug}/`},twitter:{card:'summary',title:c.name,description:c.description}}}
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const c=collections.find(c=>c.slug===slug);if(!c)notFound();return <CollectionPage collection={c}/>}