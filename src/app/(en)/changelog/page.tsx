import { ChangelogView, changelogMetadata } from "@/views/BlogViews";

export const metadata = changelogMetadata("en");

export default function Page() {
  return <ChangelogView locale="en" />;
}
