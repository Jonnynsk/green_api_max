import { useState } from "react";
import styles from "./styles/index.module.scss";

export default function NewChatModal({ onCreateChat, onClose }) {
  const [newPhoneInput, setNewPhoneInput] = useState("");
  const [error, setError] = useState("");

  const validatePhone = (phone) => {
    const cleanPhone = phone.replace(/\D/g, "");
    
    if (!cleanPhone) {
      return "Введите номер телефона";
    }
    if (cleanPhone.length < 10) {
      return "Номер слишком короткий (минимум 10 цифр)";
    }
    if (cleanPhone.length > 15) {
      return "Номер слишком длинный (максимум 15 цифр)";
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validatePhone(newPhoneInput);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    const result = await onCreateChat(newPhoneInput);
    if (result && !result.success) {
      setError(result.error);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setNewPhoneInput(value);
    if (error) setError(null);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalContent__header}>
          <h3>Новый чат</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit} className={styles.modalContent__form}>
          <div className={styles.formGroup}>
            <label>Номер телефона получателя (с кодом страны)</label>
            <input
              type="text"
              placeholder="79001234567"
              value={newPhoneInput}
              onChange={handleInputChange}
              autoFocus
            />
            {error && <div className={styles.errorText}>{error}</div>}
          </div>
          <div className={styles.footer}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={onClose}
            >
              Отмена
            </button>
            <button type="submit" className={styles.btnPrimary} disabled={!!error}>
              Создать чат
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}