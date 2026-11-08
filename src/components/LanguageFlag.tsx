import type { Locale } from "@/lib/generator";

/**
 * A small flag for each language, drawn inline so it looks the same everywhere (Windows shows
 * flag emoji as letters). Each is a flag commonly associated with the language: the site's
 * Portuguese is Brazilian, and its English uses US terms and inches. Simplified at this size.
 */
const FLAGS: Record<Locale, React.ReactNode> = {
  en: (
    <>
      <rect width="21" height="15" fill="#ffffff" />
      {[0, 2, 4, 6].map((i) => (
        <rect key={i} y={(i * 15) / 7} width="21" height={15 / 7} fill="#b22234" />
      ))}
      <rect width="9" height={(15 * 4) / 7} fill="#3c3b6e" />
    </>
  ),
  es: (
    <>
      <rect width="21" height="15" fill="#aa151b" />
      <rect y="3.75" width="21" height="7.5" fill="#f1bf00" />
    </>
  ),
  fr: (
    <>
      <rect width="7" height="15" fill="#0055a4" />
      <rect x="7" width="7" height="15" fill="#ffffff" />
      <rect x="14" width="7" height="15" fill="#ef4135" />
    </>
  ),
  de: (
    <>
      <rect width="21" height="5" fill="#000000" />
      <rect y="5" width="21" height="5" fill="#dd0000" />
      <rect y="10" width="21" height="5" fill="#ffce00" />
    </>
  ),
  pt: (
    <>
      <rect width="21" height="15" fill="#009b3a" />
      <path d="M10.5 1.8 19.2 7.5 10.5 13.2 1.8 7.5Z" fill="#ffdf00" />
      <circle cx="10.5" cy="7.5" r="3.4" fill="#002776" />
    </>
  ),
  it: (
    <>
      <rect width="7" height="15" fill="#008c45" />
      <rect x="7" width="7" height="15" fill="#f4f5f0" />
      <rect x="14" width="7" height="15" fill="#cd212a" />
    </>
  ),
  nl: (
    <>
      <rect width="21" height="5" fill="#ae1c28" />
      <rect y="5" width="21" height="5" fill="#ffffff" />
      <rect y="10" width="21" height="5" fill="#21468b" />
    </>
  ),
};

export function LanguageFlag({ locale, className }: { locale: Locale; className?: string }) {
  return (
    <svg viewBox="0 0 21 15" width="21" height="15" className={className} aria-hidden focusable="false">
      {FLAGS[locale]}
    </svg>
  );
}
