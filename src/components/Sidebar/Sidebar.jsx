import { Plus, Search } from "lucide-react";
import styles from "./styles/index.module.scss";

export default function Sidebar({
  chats,
  activeChatId,
  onSelectChat,
  searchQuery,
  onSearchChange,
  onOpenNewChat,
}) {
  return (
    <div className={styles.sidebar}>
      <div className={styles.sidebar__header}>
        <h2>Чаты</h2>
        <button
          className={styles["sidebar__plus-btn"]}
          title="Новый чат"
          onClick={onOpenNewChat}
        >
          <Plus size={20} />
        </button>
      </div>

      <div className={styles.sidebar__search}>
        <div className={styles["sidebar__search-wrapper"]}>
          <Search size={16} color="var(--text-secondary)" />
          <input
            type="text"
            className={styles["sidebar__search-wrapper__input"]}
            placeholder="Найти"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.sidebar__list}>
        {chats.length === 0 ? (
          <div className={styles["empty-message"]}>
            <p>Пока нет активных чатов.</p>
            <p style={{ marginTop: "8px" }}>
              Нажмите <Plus size={14} style={{ display: "inline" }} /> выше,
              чтобы создать чат.
            </p>
          </div>
        ) : (
          chats.map((chat) => (
            <div
              key={chat.id}
              className={`${styles["chat-card"]} ${activeChatId === chat.id ? styles["chat-card--active"] : ""}`}
              onClick={() => onSelectChat(chat.id)}
            >
              <div className={styles["chat-card__avatar"]}>
                {chat.name ? chat.name.slice(-4) : "📱"}
              </div>
              <div className={styles["chat-card__info"]}>
                <div className={styles["chat-card__header"]}>
                  <span className={styles["chat-card__name"]}>{chat.name}</span>
                </div>
                <div className={styles["chat-card__preview"]}>
                  {chat.lastMessage || "Нет сообщений"}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}