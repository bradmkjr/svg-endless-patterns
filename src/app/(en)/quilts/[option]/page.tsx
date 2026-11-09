import { optionMetadata } from "@/lib/toolPages";
import { toolSlugs } from "@/lib/toolOptions";
import { QuiltView, quiltMetadata } from "@/views/QuiltView";

type Props = { params: Promise<{ option: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return toolSlugs("quilt");
}

export async function generateMetadata({ params }: Props) {
  return optionMetadata("quilt", "en", (await params).option, quiltMetadata("en"));
}

export default async function Page({ params }: Props) {
  return <QuiltView locale="en" option={(await params).option} />;
}
