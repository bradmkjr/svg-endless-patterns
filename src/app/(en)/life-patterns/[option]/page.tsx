import { optionMetadata } from "@/lib/toolPages";
import { toolSlugs } from "@/lib/toolOptions";
import { LifeView, lifeMetadata } from "@/views/LifeView";

type Props = { params: Promise<{ option: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return toolSlugs("life");
}

export async function generateMetadata({ params }: Props) {
  return optionMetadata("life", "en", (await params).option, lifeMetadata("en"));
}

export default async function Page({ params }: Props) {
  return <LifeView locale="en" option={(await params).option} />;
}
