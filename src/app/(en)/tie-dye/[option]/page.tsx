import { optionMetadata } from "@/lib/toolPages";
import { toolSlugs } from "@/lib/toolOptions";
import { TieDyeView, tieDyeMetadata } from "@/views/TieDyeView";

type Props = { params: Promise<{ option: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return toolSlugs("tieDye");
}

export async function generateMetadata({ params }: Props) {
  return optionMetadata("tieDye", "en", (await params).option, tieDyeMetadata("en"));
}

export default async function Page({ params }: Props) {
  return <TieDyeView locale="en" option={(await params).option} />;
}
