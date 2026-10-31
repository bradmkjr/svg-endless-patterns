import { TruchetView, truchetMetadata } from "@/views/TruchetView";

export const metadata = truchetMetadata("en");

export default function Page() {
  return <TruchetView locale="en" />;
}
