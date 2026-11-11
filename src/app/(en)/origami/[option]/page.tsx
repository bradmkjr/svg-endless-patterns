import { optionMetadata } from "@/lib/toolPages";
import { toolSlugs } from "@/lib/toolOptions";
import { OrigamiView, origamiMetadata } from "@/views/OrigamiView";

type Props = { params: Promise<{ option: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return toolSlugs("origami");
}

export async function generateMetadata({ params }: Props) {
  return optionMetadata("origami", "en", (await params).option, origamiMetadata("en"));
}

export default async function Page({ params }: Props) {
  return <OrigamiView locale="en" option={(await params).option} />;
}
