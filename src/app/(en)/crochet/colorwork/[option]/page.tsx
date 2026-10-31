import { optionMetadata } from "@/lib/toolPages";
import { toolSlugs } from "@/lib/toolOptions";
import { CrochetColorworkView, crochetColorworkMetadata } from "@/views/CrochetColorworkViews";

type Props = { params: Promise<{ option: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return toolSlugs("crochetColorwork");
}

export async function generateMetadata({ params }: Props) {
  return optionMetadata("crochetColorwork", "en", (await params).option, crochetColorworkMetadata("en"));
}

export default async function Page({ params }: Props) {
  return <CrochetColorworkView locale="en" option={(await params).option} />;
}
