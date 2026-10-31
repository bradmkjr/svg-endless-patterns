import { BlogView, blogMetadata } from "@/views/BlogViews";

export const metadata = blogMetadata("en");

export default function Page() {
  return <BlogView locale="en" />;
}
