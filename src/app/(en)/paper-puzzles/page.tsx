import { PuzzleHubView, puzzleMetadata } from "@/views/PuzzleViews";

export const metadata = puzzleMetadata("en");

export default function Page() {
  return <PuzzleHubView locale="en" />;
}
