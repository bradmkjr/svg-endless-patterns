import { optionMetadata } from "@/lib/toolPages";
import { toolSlugs } from "@/lib/toolOptions";
import { OrigamiTessellationView, origamiTessellationMetadata } from "@/views/OrigamiTessellationView";

type Props = { params: Promise<{ option: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return toolSlugs("origamiTessellation");
}

export async function generateMetadata({ params }: Props) {
  return optionMetadata("origamiTessellation", "en", (await params).option, origamiTessellationMetadata("en"));
}

export default async function Page({ params }: Props) {
  return <OrigamiTessellationView locale="en" option={(await params).option} />;
}
