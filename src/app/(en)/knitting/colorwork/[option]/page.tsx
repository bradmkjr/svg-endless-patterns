import { optionMetadata } from "@/lib/toolPages";
import { toolSlugs } from "@/lib/toolOptions";
import { KnitColorworkView, knitColorworkMetadata } from "@/views/KnitColorworkViews";

type Props = { params: Promise<{ option: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return toolSlugs("knitColorwork");
}

export async function generateMetadata({ params }: Props) {
  return optionMetadata("knitColorwork", "en", (await params).option, knitColorworkMetadata("en"));
}

export default async function Page({ params }: Props) {
  return <KnitColorworkView locale="en" option={(await params).option} />;
}
