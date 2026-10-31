import { optionMetadata } from "@/lib/toolPages";
import { toolSlugs } from "@/lib/toolOptions";
import { SashikoView, sashikoMetadata } from "@/views/SashikoView";

type Props = { params: Promise<{ option: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return toolSlugs("sashiko");
}

export async function generateMetadata({ params }: Props) {
  return optionMetadata("sashiko", "en", (await params).option, sashikoMetadata("en"));
}

export default async function Page({ params }: Props) {
  return <SashikoView locale="en" option={(await params).option} />;
}
