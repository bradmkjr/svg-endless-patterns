import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page prose">
      <h1>That page isn&apos;t here</h1>
      <p>
        The link may be out of date. You can pick a design from <Link href="/blocks/">all the blocks</Link>.
      </p>
    </div>
  );
}
