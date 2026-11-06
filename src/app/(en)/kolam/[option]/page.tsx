import { optionMetadata } from "@/lib/toolPages";
import { toolSlugs } from "@/lib/toolOptions";
import { KolamView, kolamMetadata } from "@/views/KolamView";

type Props = { params: Promise<{ option: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return toolSlugs("kolam");
}

export async function generateMetadata({ params }: Props) {
  return optionMetadata("kolam", "en", (await params).option, kolamMetadata("en"));
}

export default async function Page({ params }: Props) {
  return <KolamView locale="en" option={(await params).option} />;
}
