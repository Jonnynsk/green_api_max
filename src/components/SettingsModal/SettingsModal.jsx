import { useState } from "react";
import styles from "./styles/index.module.scss";

export default function SettingsModal({
  initialId,
  initialToken,
  stateMessage,
  instanceState,
  onSave,
  onClose,
  isForced = false,
}) {
  const [id, setId] = useState(initialId);
  const [token, setToken] = useState(initialToken);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(id.trim(), token.trim());
  };

  const handleLogout = () => {
    localStorage.removeItem("green_idInstance");
    localStorage.removeItem("green_apiTokenInstance");
    localStorage.removeItem("green_chats");
    localStorage.removeItem("green_authorized");
    onSave("", "");
    onClose();
    window.location.reload();
  };

  const dotClass =
    instanceState === "authorized"
      ? styles["statusDot--authorized"]
      : instanceState === "checking"
        ? styles["statusDot--checking"]
        : styles["statusDot--disconnected"];

  return (
    <div
      className={styles.modalOverlay}
      onClick={isForced ? (e) => e.stopPropagation() : onClose}
    >
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalContent__header}>
          <h3>Учетные данные GREEN-API: MAX</h3>
          {!isForced && (
            <button className={styles.closeBtn} onClick={onClose}>
              &times;
            </button>
          )}
        </div>
        <form onSubmit={handleSubmit} className={styles.modalContent__form}>
          <div className={styles.formGroup}>
            <label>idInstance</label>
            <input
              type="text"
              placeholder="напр. 1103123456"
              value={id}
              onChange={(e) => setId(e.target.value)}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label>apiTokenInstance</label>
            <input
              type="password"
              placeholder="напр. a3b5c7d9..."
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
            />
          </div>
          <div className={styles.statusRow}>
            <span className={`${styles.statusDot} ${dotClass}`}></span>
            <span>
              Статус: <strong>{stateMessage}</strong>
            </span>
          </div>
          <div className={styles.footer}>
            {initialId && !isForced && (
              <button
                type="button"
                className={`${styles.btnSecondary} ${styles["btnSecondary--danger"]}`}
                onClick={handleLogout}
              >
                Выйти
              </button>
            )}

            <button type="submit" className={styles.btnPrimary}>
              Войти
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
