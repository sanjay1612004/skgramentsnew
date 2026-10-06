'use client';
import Link from '@/components/static-link';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useModal } from './modal-provider';
import { site } from '@/data/site';
import { getWhatsAppUrl } from '@/lib/contact';
import WhatsAppIcon from './whatsapp-icon';
const links = [{ name: 'T-Shirts', href: '/#shop' },{ name: 'Collections', href: '/#collections' },{ name: 'Bulk orders', href: '/bulk-tshirt-orders/' },{ name: 'About', href: '/#about' },{ name: 'FAQ', href: '/#faq' }];
export default function Navigation() {
 const [scrolled,setScrolled]=useState(false),[menu,setMenu]=useState(false); const modal=useModal(), reduced=useReducedMotion();
 useEffect(()=>{
  let frame=0,lastScrolled=false;
  const update=()=>{
   frame=0;
   const nextScrolled=window.scrollY>80;
   if(nextScrolled!==lastScrolled){lastScrolled=nextScrolled;setScrolled(nextScrolled);}
  };
  const onScroll=()=>{if(!frame)frame=requestAnimationFrame(update);};
  onScroll();
  window.addEventListener('scroll',onScroll,{passive:true});
  return()=>{
   window.removeEventListener('scroll',onScroll);
   cancelAnimationFrame(frame);
  };
 },[]);
 useEffect(()=>{ if(!menu)return; const prior=document.activeElement as HTMLElement; const old=document.body.style.overflow; document.body.style.overflow='hidden'; const root=document.getElementById('mobile-menu'); const list=()=>Array.from(root?.querySelectorAll<HTMLElement>('a,button')||[]); list()[0]?.focus(); const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape')setMenu(false);if(e.key==='Tab'){const a=list();if(e.shiftKey&&document.activeElement===a[0]){e.preventDefault();a[a.length-1]?.focus();}else if(!e.shiftKey&&document.activeElement===a[a.length-1]){e.preventDefault();a[0]?.focus();}}};document.addEventListener('keydown',onKey);return()=>{document.body.style.overflow=old;document.removeEventListener('keydown',onKey);prior?.focus();};},[menu]);
 return <><a href="#main" className="skip-link">Skip to content</a><motion.header className={`navigation ${scrolled?'floating':''}`} initial={reduced?false:{y:-20,opacity:0}} animate={{y:0,opacity:1}} transition={{delay:1.3,duration:.6}}><Link href="/" className="logo" aria-label="SK GARMENTS home">SK<span>GARMENTS</span></Link><nav aria-label="Main navigation" className="desktop-nav">{links.map(l=><Link key={l.name} href={l.href}>{l.name}</Link>)}</nav><div className="nav-actions"><button className="nav-shop" onClick={()=>modal.openQuote()}>GET A QUOTE</button><button className="mobile-menu-button icon-button" aria-label="Open navigation menu" aria-expanded={menu} onClick={()=>setMenu(true)}><Menu/></button></div></motion.header><AnimatePresence>{menu && <motion.div id="mobile-menu" className="mobile-menu" role="dialog" aria-modal="true" aria-label="Navigation menu" initial={{clipPath:'inset(0 0 100% 0)'}} animate={{clipPath:'inset(0 0 0% 0)'}} exit={{clipPath:'inset(0 0 100% 0)'}} transition={{duration:reduced?0:.45}}><div className="mobile-menu-top"><Link className="logo" href="/" onClick={()=>setMenu(false)}>SK<span>GARMENTS</span></Link><button className="icon-button" aria-label="Close navigation menu" onClick={()=>setMenu(false)}><X/></button></div><nav>{links.map((l,i)=><motion.div key={l.name} initial={{y:30,opacity:0}} animate={{y:0,opacity:1}} transition={{delay:.1+i*.06}}><Link href={l.href} onClick={()=>setMenu(false)}><small>0{i+1}</small>{l.name}</Link></motion.div>)}</nav><button className="mobile-quote" onClick={()=>{setMenu(false);modal.openQuote();}}>Get a quote</button><p>Wear what feels like you.</p></motion.div>}</AnimatePresence><div className="floating-contact-actions" aria-label="Contact SK GARMENTS">{site.contact.whatsapp && <a className="floating-whatsapp" href={getWhatsAppUrl()} target="_blank" rel="noopener noreferrer" aria-label="Chat with SK GARMENTS on WhatsApp" title="Chat on WhatsApp"><WhatsAppIcon /></a>}<button className="floating-shop" onClick={()=>modal.openQuote()}>GET A QUOTE <span>✳</span></button></div></>;
}
