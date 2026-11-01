import { LifeView, lifeMetadata } from "@/views/LifeView";

export const metadata = lifeMetadata("en");

export default function Page() {
  return <LifeView locale="en" />;
}
