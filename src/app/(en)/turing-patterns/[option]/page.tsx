import { optionMetadata } from "@/lib/toolPages";
import { toolSlugs } from "@/lib/toolOptions";
import { ReactionDiffusionView, reactionDiffusionMetadata } from "@/views/ReactionDiffusionView";

type Props = { params: Promise<{ option: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return toolSlugs("reactionDiffusion");
}

export async function generateMetadata({ params }: Props) {
  return optionMetadata("reactionDiffusion", "en", (await params).option, reactionDiffusionMetadata("en"));
}

export default async function Page({ params }: Props) {
  return <ReactionDiffusionView locale="en" option={(await params).option} />;
}
