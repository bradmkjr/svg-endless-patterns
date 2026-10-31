import { optionMetadata } from "@/lib/toolPages";
import { toolSlugs } from "@/lib/toolOptions";
import { FractalView, fractalMetadata } from "@/views/FractalView";

type Props = { params: Promise<{ option: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return toolSlugs("fractal");
}

export async function generateMetadata({ params }: Props) {
  return optionMetadata("fractal", "en", (await params).option, fractalMetadata("en"));
}

export default async function Page({ params }: Props) {
  return <FractalView locale="en" option={(await params).option} />;
}
