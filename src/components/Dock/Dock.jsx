import {
  MessageSquare,
  Users,
  Phone,
  Settings,
  LogOut,
} from "lucide-react";
import styles from "./styles/index.module.scss";

export default function Dock({
  instanceState,
  onOpenSettings,
  onOpenLogout,
}) {
  return (
    <div className={styles.dock}>
      <div className={styles.dock__top}>
        <button
          className={`${styles.dock__item} ${styles["dock__item--active"]}`}
          title="Чаты"
        >
          <MessageSquare size={22} />
          <span>Чаты</span>
        </button>
        <button className={styles.dock__item} title="Контакты">
          <Users size={22} />
          <span>Контакты</span>
        </button>
        <button className={styles.dock__item} title="Звонки">
          <Phone size={22} />
          <span>Звонки</span>
        </button>
      </div>
      <div className={styles.dock__bottom}>
        {instanceState === "authorized" ? (
          <button
            className={`${styles.dock__item} ${styles["dock__item--logout"]}`}
            title="Выйти"
            onClick={onOpenLogout}
          >
            <LogOut size={22} />
            <span>Выйти</span>
          </button>
        ) : (
          <button
            className={styles.dock__item}
            title="Настройки"
            onClick={onOpenSettings}
          >
            <Settings size={22} />
            <span>Настройки</span>
          </button>
        )}
      </div>
    </div>
  );
}
