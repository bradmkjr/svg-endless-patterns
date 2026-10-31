import { optionMetadata } from "@/lib/toolPages";
import { toolSlugs } from "@/lib/toolOptions";
import { NeedlepointView, needlepointMetadata } from "@/views/NeedlepointView";

type Props = { params: Promise<{ option: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return toolSlugs("needlepoint");
}

export async function generateMetadata({ params }: Props) {
  return optionMetadata("needlepoint", "en", (await params).option, needlepointMetadata("en"));
}

export default async function Page({ params }: Props) {
  return <NeedlepointView locale="en" option={(await params).option} />;
}
