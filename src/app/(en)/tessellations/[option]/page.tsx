import { optionMetadata } from "@/lib/toolPages";
import { toolSlugs } from "@/lib/toolOptions";
import { TessellationView, tessellationMetadata } from "@/views/TessellationView";

type Props = { params: Promise<{ option: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return toolSlugs("tessellation");
}

export async function generateMetadata({ params }: Props) {
  return optionMetadata("tessellation", "en", (await params).option, tessellationMetadata("en"));
}

export default async function Page({ params }: Props) {
  return <TessellationView locale="en" option={(await params).option} />;
}
