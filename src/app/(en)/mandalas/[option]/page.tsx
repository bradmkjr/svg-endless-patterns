import { optionMetadata } from "@/lib/toolPages";
import { toolSlugs } from "@/lib/toolOptions";
import { MandalaView, mandalaMetadata } from "@/views/MandalaView";

type Props = { params: Promise<{ option: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return toolSlugs("mandala");
}

export async function generateMetadata({ params }: Props) {
  return optionMetadata("mandala", "en", (await params).option, mandalaMetadata("en"));
}

export default async function Page({ params }: Props) {
  return <MandalaView locale="en" option={(await params).option} />;
}
