import styles from "./styles/index.module.scss";

export default function LogoutModal({ onConfirmLogout, onClose }) {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h3 className={styles.modalContent__title}>Выход из аккаунта</h3>
        <p className={styles.modalContent__text}>
          Вы уверены, что хотите выйти?
        </p>
        <div className={styles.modalContent__footer}>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={onClose}
          >
            Отмена
          </button>
          <button
            type="button"
            className={styles.btnDanger}
            onClick={onConfirmLogout}
          >
            Выйти
          </button>
        </div>
      </div>
    </div>
  );
}
