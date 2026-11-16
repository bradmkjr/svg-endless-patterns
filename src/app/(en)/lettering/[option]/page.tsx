import { optionMetadata } from "@/lib/toolPages";
import { toolSlugs } from "@/lib/toolOptions";
import { LetteringView, letteringMetadata } from "@/views/LetteringView";

type Props = { params: Promise<{ option: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return toolSlugs("lettering");
}

export async function generateMetadata({ params }: Props) {
  return optionMetadata("lettering", "en", (await params).option, letteringMetadata("en"));
}

export default async function Page({ params }: Props) {
  return <LetteringView locale="en" option={(await params).option} />;
}
