import type { Locale } from "@/lib/generator";
import copy from "@/i18n/messages/apiStatus.json";
import styles from "./BlockBuilder.module.css";

/** Stands in for a preview until the API's first answer. */
export function ToolLoading({ locale }: { locale: Locale }) {
  return <p className={styles.note}>{copy[locale].loading}</p>;
}
