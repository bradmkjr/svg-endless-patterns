import { optionMetadata } from "@/lib/toolPages";
import { toolSlugs } from "@/lib/toolOptions";
import { NatureView, natureMetadata } from "@/views/NatureView";

type Props = { params: Promise<{ option: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return toolSlugs("nature");
}

export async function generateMetadata({ params }: Props) {
  return optionMetadata("nature", "en", (await params).option, natureMetadata("en"));
}

export default async function Page({ params }: Props) {
  return <NatureView locale="en" option={(await params).option} />;
}
