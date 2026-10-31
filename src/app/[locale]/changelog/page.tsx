import { routeLocale } from "@/lib/i18n";
import { ChangelogView, changelogMetadata } from "@/views/BlogViews";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return changelogMetadata(routeLocale((await params).locale));
}

export default async function Page({ params }: Props) {
  return <ChangelogView locale={routeLocale((await params).locale)} />;
}
