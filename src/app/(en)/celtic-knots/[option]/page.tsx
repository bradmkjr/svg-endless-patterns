import { optionMetadata } from "@/lib/toolPages";
import { toolSlugs } from "@/lib/toolOptions";
import { CelticKnotView, celticKnotMetadata } from "@/views/CelticKnotView";

type Props = { params: Promise<{ option: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return toolSlugs("celticKnot");
}

export async function generateMetadata({ params }: Props) {
  return optionMetadata("celticKnot", "en", (await params).option, celticKnotMetadata("en"));
}

export default async function Page({ params }: Props) {
  return <CelticKnotView locale="en" option={(await params).option} />;
}
