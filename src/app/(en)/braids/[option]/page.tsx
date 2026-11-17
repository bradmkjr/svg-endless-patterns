import { optionMetadata } from "@/lib/toolPages";
import { toolSlugs } from "@/lib/toolOptions";
import { BraidView, braidMetadata } from "@/views/BraidView";

type Props = { params: Promise<{ option: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return toolSlugs("braid");
}

export async function generateMetadata({ params }: Props) {
  return optionMetadata("braid", "en", (await params).option, braidMetadata("en"));
}

export default async function Page({ params }: Props) {
  return <BraidView locale="en" option={(await params).option} />;
}
