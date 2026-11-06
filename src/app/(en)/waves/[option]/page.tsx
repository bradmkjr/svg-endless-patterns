import { optionMetadata } from "@/lib/toolPages";
import { toolSlugs } from "@/lib/toolOptions";
import { WavesView, wavesMetadata } from "@/views/WavesView";

type Props = { params: Promise<{ option: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return toolSlugs("waves");
}

export async function generateMetadata({ params }: Props) {
  return optionMetadata("waves", "en", (await params).option, wavesMetadata("en"));
}

export default async function Page({ params }: Props) {
  return <WavesView locale="en" option={(await params).option} />;
}
