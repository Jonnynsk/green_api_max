import { useRef, useEffect } from "react";
import {
  MessageSquare,
  Send,
  CheckCheck,
  RefreshCw,
  ShieldCheck,
  Paperclip,
  Smile,
  Mic,
  User,
} from "lucide-react";
import styles from "./styles/index.module.scss";

export default function ChatWindow({
  activeChat,
  messageInput,
  onMessageInputChange,
  onSendMessage,
  onSimulateReply,
  onCheckNewMessages,
}) {
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat?.messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  if (!activeChat) return null;

  return (
    <div className={styles.chatWindow}>
      <div className={styles.chatWindow__header}>
        <div className={styles.contactInfo}>
          <div className={styles.avatar}>
            {activeChat.name ? activeChat.name.slice(-4) : <User size={20} />}
          </div>
          <div className={styles.details}>
            <h3>{activeChat.name}</h3>
            <p>{activeChat.id}</p>
          </div>
        </div>
      </div>

      <div className={styles.chatWindow__messages}>
        {activeChat.messages.length === 0 ? (
          <div className={styles.encryptionNotice}>
            <ShieldCheck
              size={32}
              style={{ margin: "0 auto 8px", color: "#a78bfa" }}
            />
            <p className={styles.title}>
              Сообщения защищены сквозным шифрованием в МАКС.
            </p>
            <p className={styles.sub}>
              Отправьте свое первое текстовое сообщение ниже.
            </p>
          </div>
        ) : (
          activeChat.messages.map((msg) => (
            <div
              key={msg.id}
              className={`${styles.bubble} ${msg.sender === "out" ? styles["bubble--out"] : styles["bubble--in"]}`}
            >
              <span>{msg.text}</span>
              <div className={styles.meta}>
                <span className={styles.time}>{msg.timestamp}</span>
                {msg.sender === "out" && (
                  <CheckCheck size={14} color="#53bdeb" />
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={onSendMessage} className={styles.chatWindow__footer}>
        <div className={styles.inputBox}>
          <input
            ref={inputRef}
            type="text"
            placeholder="Сообщение"
            value={messageInput}
            onChange={(e) => onMessageInputChange(e.target.value)}
          />
          <button type="button" className={styles.iconBtn} title="Эмодзи">
            <Smile size={20} />
          </button>
        </div>
        {messageInput.trim() ? (
          <button type="submit" className={styles.sendBtn} title="Отправить">
            <Send size={18} />
          </button>
        ) : (
          <button
            type="button"
            className={styles.iconBtn}
            title="Голосовое сообщение"
          >
            <Mic size={20} />
          </button>
        )}
      </form>
    </div>
  );
}
