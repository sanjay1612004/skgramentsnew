'use client';
import { CSSProperties } from 'react';
import { getColor, Product } from '@/data/products';
const atlas = '/images/tee-atlas.webp';
export default function Garment({ color = 'Bone', back = false, graphic = 'none', className = '', style, label, frontImage = atlas, backImage = atlas }: { color?: string; back?: boolean; graphic?: Product['graphic']; className?: string; style?: CSSProperties; label?: string; frontImage?: string; backImage?: string }) {
 const swatch = getColor(color), image=back?backImage:frontImage, mockup=image===atlas;
 return <div className={`garment ${className}`} style={style} role="img" aria-label={label || `${color} ${mockup?'concept ':''}T-shirt, ${back ? 'back' : 'front'} view`}>
   {mockup?<div className="garment-photo" style={{ backgroundImage: `url(${image})`, backgroundPosition: back ? '100% center' : '0% center', filter: swatch.filter }} />:<img className="real-garment-image" src={image} alt="" loading="lazy"/>}
   {mockup&&<div className={`tee-print ${back ? 'back-print' : 'front-print'} ${color === 'Washed Black' || color === 'Forest' ? 'light-print' : ''}`} aria-hidden="true">
     {back && graphic === 'after-dark' ? <><span className="print-mini">SK GARMENTS — AFTER HOURS</span><strong>AFTER<br/>DARK</strong><span className="print-orbit">✳</span><span className="print-mini">MAKE YOUR OWN ENERGY.</span></> : graphic === 'studio' ? <b>SK<br/><small>STUDIO</small></b> : <span className="tiny-sk">SK</span>}
   </div>}
 </div>;
}