import { optionMetadata } from "@/lib/toolPages";
import { toolSlugs } from "@/lib/toolOptions";
import { TruchetView, truchetMetadata } from "@/views/TruchetView";

type Props = { params: Promise<{ option: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return toolSlugs("truchet");
}

export async function generateMetadata({ params }: Props) {
  return optionMetadata("truchet", "en", (await params).option, truchetMetadata("en"));
}

export default async function Page({ params }: Props) {
  return <TruchetView locale="en" option={(await params).option} />;
}
