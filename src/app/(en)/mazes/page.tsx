import { MazeView, mazeMetadata } from "@/views/MazeView";

export const metadata = mazeMetadata("en");

export default function Page() {
  return <MazeView locale="en" />;
}
