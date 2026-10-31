import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "How the Calculations Work",
  description: "The rotary-cutting formulas, rounding and yardage assumptions behind the quilt block builder.",
  alternates: { canonical: absoluteUrl("/about/") },
};

export default function AboutPage() {
  return (
    <div className="page prose">
      <h1>How the calculations work</h1>
      <p className="lede">Every number comes from the block&apos;s geometry and the settings you choose. Here are the rules, so you can check them against your own.</p>

      <h2>Cut sizes</h2>
      <ul>
        <li>Squares and rectangles: finished size plus 1/2&quot;.</li>
        <li>Half-square triangles: a square of the finished leg plus 7/8&quot;, cut once diagonally.</li>
        <li>Quarter-square triangles: a square of the finished long side plus 1 1/4&quot;, cut twice diagonally.</li>
        <li>All seams are 1/4&quot;.</li>
      </ul>

      <h2>When a size falls between ruler marks</h2>
      <p>
        A 12&quot; block on a 7-unit grid has units of about 1.714&quot;, which no ruler marks. The builder rounds those cuts up
        to the next 1/8&quot;, says so, and suggests the nearest block sizes that divide evenly. The center of a Square in a
        Square never lands on a mark, at any size, so plan to trim that block.
      </p>

      <h2>Yardage</h2>
      <p>
        Pieces are cut in strips across the fabric, using 40&quot; of usable width unless you change it. The builder tries both
        strip directions and uses the shorter one, adds 10% for straightening and mistakes, then rounds up to the next
        1/8 yard. Backing extends 4&quot; past the quilt on every side. Binding is 2 1/2&quot; strips with 20&quot; extra for
        joins and corners. These figures are a guide, so check them before you buy or cut.
      </p>

      <h2>Your data</h2>
      <p>Your design is generated in your browser and is not sent or stored anywhere. Your settings live only in the page&apos;s address, which is what makes a share link work.</p>

      <h2>The designs</h2>
      <p>Blocks are drawn from geometry using traditional names. Layouts for the same name can vary between quilters and sources, so yours may differ from one you know.</p>
    </div>
  );
}
