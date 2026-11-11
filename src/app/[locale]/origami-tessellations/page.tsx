import { routeLocale } from "@/lib/i18n";
import { OrigamiTessellationView, origamiTessellationMetadata } from "@/views/OrigamiTessellationView";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return origamiTessellationMetadata(routeLocale((await params).locale));
}

export default async function Page({ params }: Props) {
  return <OrigamiTessellationView locale={routeLocale((await params).locale)} />;
}
