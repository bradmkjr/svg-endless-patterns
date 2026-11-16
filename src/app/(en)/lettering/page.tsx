import { LetteringView, letteringMetadata } from "@/views/LetteringView";

export const metadata = letteringMetadata("en");

export default function Page() {
  return <LetteringView locale="en" />;
}
