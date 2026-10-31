import { AcknowledgementsView, acknowledgementsMetadata } from "@/views/AcknowledgementsView";

export const metadata = acknowledgementsMetadata("en");

export default function Page() {
  return <AcknowledgementsView locale="en" />;
}
