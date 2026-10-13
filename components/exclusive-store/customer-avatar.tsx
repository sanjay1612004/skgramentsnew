'use client';
import { useState } from 'react';
import Image from 'next/image';
import { UserRound } from 'lucide-react';
import type { Customer } from '@/lib/store-api';

export default function CustomerAvatar({ customer }: { customer?: Customer }) {
  const [failed, setFailed] = useState('');
  return <span className="ss-avatar">{customer?.avatarUrl && failed !== customer.avatarUrl ? <Image unoptimized width={48} height={48} src={customer.avatarUrl} alt="" onError={() => setFailed(customer.avatarUrl || '')} /> : customer ? <span aria-hidden="true">{customer.firstName.charAt(0).toUpperCase()}{customer.lastName?.charAt(0).toUpperCase()}</span> : <UserRound size={21} aria-hidden="true" />}</span>;
}
