import { BlocksView, blocksMetadata } from "@/views/BlockViews";

export const metadata = blocksMetadata("en");

export default function Page() {
  return <BlocksView locale="en" />;
}
