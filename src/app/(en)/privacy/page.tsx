import { PrivacyView, privacyMetadata } from "@/views/LegalViews";

export const metadata = privacyMetadata("en");

export default function Page() {
  return <PrivacyView locale="en" />;
}
