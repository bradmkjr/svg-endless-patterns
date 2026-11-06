import { optionMetadata } from "@/lib/toolPages";
import { toolSlugs } from "@/lib/toolOptions";
import { ChineseLatticeView, chineseLatticeMetadata } from "@/views/ChineseLatticeView";

type Props = { params: Promise<{ option: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return toolSlugs("chineseLattice");
}

export async function generateMetadata({ params }: Props) {
  return optionMetadata("chineseLattice", "en", (await params).option, chineseLatticeMetadata("en"));
}

export default async function Page({ params }: Props) {
  return <ChineseLatticeView locale="en" option={(await params).option} />;
}
