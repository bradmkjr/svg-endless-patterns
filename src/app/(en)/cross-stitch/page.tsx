import { CrossStitchView, crossStitchMetadata } from "@/views/CrossStitchView";

export const metadata = crossStitchMetadata("en");

export default function Page() {
  return <CrossStitchView locale="en" />;
}
