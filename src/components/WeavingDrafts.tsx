import Link from "next/link";
import type { WeavingDraftLink } from "@/lib/weavingDrafts";
import styles from "./WeavingDrafts.module.css";

/** Traditional drafts as thumbnails, each opening the builder with its settings. */
export function WeavingDrafts({ drafts }: { drafts: WeavingDraftLink[] }) {
  return (
    <ul className={styles.grid}>
      {drafts.map((draft) => (
        <li key={draft.id}>
          <Link href={draft.href} className={styles.draft}>
            {/* eslint-disable-next-line @next/next/no-img-element -- a static file, loaded as it nears the screen */}
            <img src={draft.src} alt="" loading="lazy" width={160} height={160} />
            <span>{draft.name}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
