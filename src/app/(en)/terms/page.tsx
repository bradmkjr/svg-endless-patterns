import { TermsView, termsMetadata } from "@/views/LegalViews";

export const metadata = termsMetadata("en");

export default function Page() {
  return <TermsView locale="en" />;
}
