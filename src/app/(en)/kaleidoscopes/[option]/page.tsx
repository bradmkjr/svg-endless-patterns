import { optionMetadata } from "@/lib/toolPages";
import { toolSlugs } from "@/lib/toolOptions";
import { KaleidoscopeView, kaleidoscopeMetadata } from "@/views/KaleidoscopeView";

type Props = { params: Promise<{ option: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return toolSlugs("kaleidoscope");
}

export async function generateMetadata({ params }: Props) {
  return optionMetadata("kaleidoscope", "en", (await params).option, kaleidoscopeMetadata("en"));
}

export default async function Page({ params }: Props) {
  return <KaleidoscopeView locale="en" option={(await params).option} />;
}
