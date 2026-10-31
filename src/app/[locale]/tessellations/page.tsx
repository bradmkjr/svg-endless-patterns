import { routeLocale } from "@/lib/i18n";
import { TessellationView, tessellationMetadata } from "@/views/TessellationView";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return tessellationMetadata(routeLocale((await params).locale));
}

export default async function Page({ params }: Props) {
  return <TessellationView locale={routeLocale((await params).locale)} />;
}
