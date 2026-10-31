import { optionMetadata } from "@/lib/toolPages";
import { toolSlugs } from "@/lib/toolOptions";
import { GirihView, girihMetadata } from "@/views/GirihView";

type Props = { params: Promise<{ option: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return toolSlugs("girih");
}

export async function generateMetadata({ params }: Props) {
  return optionMetadata("girih", "en", (await params).option, girihMetadata("en"));
}

export default async function Page({ params }: Props) {
  return <GirihView locale="en" option={(await params).option} />;
}
