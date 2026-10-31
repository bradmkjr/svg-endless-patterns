import { CheckerboardView, checkerboardMetadata } from "@/views/CheckerboardView";

export const metadata = checkerboardMetadata("en");

export default function Page() {
  return <CheckerboardView locale="en" />;
}
