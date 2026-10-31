import { RootDocument, rootMetadata } from "@/components/RootDocument";
import { PREFIXED_LOCALES, routeLocale } from "@/lib/i18n";

type Props = { params: Promise<{ locale: string }>; children: React.ReactNode };

export const dynamicParams = false;

export function generateStaticParams() {
  return PREFIXED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Pick<Props, "params">) {
  return rootMetadata(routeLocale((await params).locale));
}

export default async function Layout({ params, children }: Props) {
  return <RootDocument locale={routeLocale((await params).locale)}>{children}</RootDocument>;
}
