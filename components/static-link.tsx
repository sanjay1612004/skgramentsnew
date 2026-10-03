import type { AnchorHTMLAttributes } from 'react';
export default function StaticLink(props:AnchorHTMLAttributes<HTMLAnchorElement>&{href:string}){return <a {...props}/>;}
