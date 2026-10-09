'use client';

import { RefObject, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { Popover } from 'radix-ui';
import { Command } from 'cmdk';
import { phoneCountries } from '@/lib/quote-validation.mjs';

function countryFlag(code: string) {
  return String.fromCodePoint(...[...code].map(letter => 127397 + letter.charCodeAt(0)));
}

export default function QuoteCountryPicker({ value, onChange, dialogRef, disabled }: {
  value: string;
  onChange: (value: string) => void;
  dialogRef: RefObject<HTMLDialogElement | null>;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [portalContainer, setPortalContainer] = useState<HTMLDialogElement | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const country = phoneCountries.find(country => country.code === value)!;

  return (
    <Popover.Root open={open} onOpenChange={next => { setPortalContainer(dialogRef.current); setOpen(next); if (!next) setSearch(''); }}>
      <input type="hidden" name="country" value={value} />
      <Popover.Trigger type="button" className="quote-country-trigger" disabled={disabled} aria-label={`Country code: ${country.name} +${country.dial}`}>
        <span className="quote-country-flag" aria-hidden="true">{countryFlag(country.code)}</span>
        <span>+{country.dial}</span>
        <ChevronDown size={12} aria-hidden="true" />
      </Popover.Trigger>
      <Popover.Portal container={portalContainer}>
        <Popover.Content className="quote-country-menu" side="bottom" align="start" sideOffset={8} collisionPadding={16}
          aria-label="Choose a country code" onOpenAutoFocus={event => { event.preventDefault(); searchRef.current?.focus(); }}>
          <Command label="Search countries" defaultValue={`${country.name} ${country.code} +${country.dial}`} loop>
            <div className="quote-country-search"><Search size={15} aria-hidden="true" />
              <Command.Input ref={searchRef} value={search} onValueChange={setSearch} placeholder="Search country or code…" aria-label="Search countries" autoComplete="off" />
            </div>
            <div className="quote-country-menu-label"><span>COUNTRY</span><span>CODE</span></div>
            <Command.List className="quote-country-list" aria-label="Countries">
              <Command.Empty className="quote-country-empty">No countries found. Try a name or dialing code.</Command.Empty>
              {phoneCountries.map(option => (
                <Command.Item key={option.code} value={`${option.name} ${option.code} +${option.dial}`} onSelect={() => { onChange(option.code); setOpen(false); setSearch(''); }}
                  className="quote-country-option" data-current={option.code === value}>
                  <span className="quote-country-flag" aria-hidden="true">{countryFlag(option.code)}</span>
                  <span className="quote-country-name">{option.name}</span>
                  <span className="quote-country-dial">+{option.dial}</span>
                  <span className="quote-country-check">{option.code === value && <Check size={14} aria-label="Current country" />}</span>
                </Command.Item>
              ))}
            </Command.List>
          </Command>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
