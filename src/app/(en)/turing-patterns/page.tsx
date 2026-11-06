import { ReactionDiffusionView, reactionDiffusionMetadata } from "@/views/ReactionDiffusionView";

export const metadata = reactionDiffusionMetadata("en");

export default function Page() {
  return <ReactionDiffusionView locale="en" />;
}
