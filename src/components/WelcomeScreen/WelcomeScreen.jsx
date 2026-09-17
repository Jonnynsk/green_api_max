import { MessageSquare, AlertCircle } from "lucide-react";
import styles from "./styles/index.module.scss";

export default function WelcomeScreen({
  instanceState,
  errorBanner,
  onOpenSettings,
}) {
  return (
    <div className={styles.welcome}>
      <div className={styles["welcome__icon-wrapper"]}>
        <MessageSquare size={40} />
      </div>
      <h2 className={styles.welcome__title}>GREEN-API: MAX</h2>
      <p className={styles.welcome__subtitle}>
        Отправляйте и получайте текстовые сообщения через GREEN-API.
      </p>
      {errorBanner && (
        <div className={styles["welcome__error-banner"]}>
          <AlertCircle size={16} />
          <span>{errorBanner}</span>
        </div>
      )}
      {instanceState !== "authorized" && (
        <button className={styles.welcome__btn} onClick={onOpenSettings}>
          Подключиться
        </button>
      )}
    </div>
  );
}
