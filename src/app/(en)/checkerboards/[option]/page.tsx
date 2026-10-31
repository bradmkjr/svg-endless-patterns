import { optionMetadata } from "@/lib/toolPages";
import { toolSlugs } from "@/lib/toolOptions";
import { CheckerboardView, checkerboardMetadata } from "@/views/CheckerboardView";

type Props = { params: Promise<{ option: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return toolSlugs("checkerboard");
}

export async function generateMetadata({ params }: Props) {
  return optionMetadata("checkerboard", "en", (await params).option, checkerboardMetadata("en"));
}

export default async function Page({ params }: Props) {
  return <CheckerboardView locale="en" option={(await params).option} />;
}
