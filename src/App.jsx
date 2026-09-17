import { useState, useEffect, useRef } from "react";
import {
  getStateInstance,
  sendMessage,
  receiveNotification,
  deleteNotification,
} from "./services/greenApi";
import Dock from "./components/Dock/Dock";
import Sidebar from "./components/Sidebar/Sidebar";
import ChatWindow from "./components/ChatWindow/ChatWindow";
import WelcomeScreen from "./components/WelcomeScreen/WelcomeScreen";
import SettingsModal from "./components/SettingsModal/SettingsModal";
import NewChatModal from "./components/NewChatModal/NewChatModal";
import LogoutModal from "./components/LogoutModal/LogoutModal";
import "./styles/main.scss";

export default function App() {
  // Credentials state
  const [idInstance, setIdInstance] = useState(
    () => localStorage.getItem("green_idInstance") || "",
  );
  const [apiTokenInstance, setApiTokenInstance] = useState(
    () => localStorage.getItem("green_apiTokenInstance") || "",
  );
  const [instanceState, setInstanceState] = useState(() => {
    return localStorage.getItem("green_authorized") === "true"
      ? "authorized"
      : "disconnected";
  });
  const [stateMessage, setStateMessage] = useState(() => {
    return localStorage.getItem("green_authorized") === "true"
      ? "Connected (Authorized)"
      : "Not connected";
  });

  // UI state
  const [chats, setChats] = useState(() => {
    const saved = localStorage.getItem("green_chats");
    return saved ? JSON.parse(saved) : [];
  });
  const [activeChatId, setActiveChatId] = useState(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [errorBanner, setErrorBanner] = useState("");

  // Refs for polling
  const pollingRef = useRef(null);
  const isPollingRef = useRef(false);

  // Save chats to localStorage
  useEffect(() => {
    localStorage.setItem("green_chats", JSON.stringify(chats));
  }, [chats]);

  // Save credentials
  const saveCredentials = (newId, newToken) => {
    setIdInstance(newId);
    setApiTokenInstance(newToken);
    localStorage.setItem("green_idInstance", newId);
    localStorage.setItem("green_apiTokenInstance", newToken);
    checkConnection(newId, newToken);
  };

  const checkConnection = async (id = idInstance, token = apiTokenInstance) => {
    if (!id || !token) {
      setInstanceState("disconnected");
      setStateMessage("Enter ID and Token");
      return;
    }
    setInstanceState("checking");
    setStateMessage("Checking connection...");
    try {
      const res = await getStateInstance(id, token);
      if (res && res.stateInstance === "authorized") {
        setInstanceState("authorized");
        setStateMessage("Connected (Authorized)");
        localStorage.setItem("green_authorized", "true");
        setErrorBanner("");
      } else {
        setInstanceState("disconnected");
        setStateMessage(`State: ${res?.stateInstance || "Unknown"}`);
        localStorage.removeItem("green_authorized");
        setErrorBanner(
          `Instance is not authorized ("${res?.stateInstance}"). Please scan the QR code in your GREEN-API account (console.green-api.com).`,
        );
      }
    } catch (err) {
      if (err.message && err.message.includes("429")) {
        setInstanceState("authorized");
        setStateMessage("Connected (Rate limited, cached)");
        localStorage.setItem("green_authorized", "true");
        setErrorBanner("");
      } else {
        setInstanceState("disconnected");
        setStateMessage("Connection failed");
        setErrorBanner(`Failed to connect to GREEN-API: ${err.message}`);
      }
    }
  };

  // Check connection on mount if credentials exist
  useEffect(() => {
    if (idInstance && apiTokenInstance) {
      if (localStorage.getItem("green_authorized") === "true") {
        setInstanceState("authorized");
        setStateMessage("Connected (Authorized)");
      } else {
        checkConnection(idInstance, apiTokenInstance);
      }
    } else {
      setShowSettingsModal(true);
    }
  }, []);

  // Polling loop for receiving messages
  useEffect(() => {
    if (instanceState !== "authorized" || !idInstance || !apiTokenInstance) {
      if (pollingRef.current) clearInterval(pollingRef.current);
      return;
    }

    const poll = async () => {
      if (isPollingRef.current) return;
      isPollingRef.current = true;

      try {
        const notif = await receiveNotification(idInstance, apiTokenInstance);
        if (notif && notif.receiptId) {
          const { receiptId, body } = notif;

          if (body && body.typeWebhook === "incomingMessageReceived") {
            const senderData = body.senderData || {};
            const messageData = body.messageData || {};

            let chatId = senderData.chatId || body.chatId;
            if (senderData.senderPhoneNumber) {
              chatId = `${senderData.senderPhoneNumber}@c.us`;
            } else if (
              senderData.sender &&
              senderData.sender.includes("@c.us")
            ) {
              chatId = senderData.sender;
            } else if (
              chatId &&
              !chatId.includes("@") &&
              /^\d{10,15}$/.test(chatId)
            ) {
              chatId = `${chatId}@c.us`;
            }

            let text = "";
            if (messageData.typeMessage === "textMessage") {
              text = messageData.textMessageData?.textMessage || "";
            } else if (messageData.typeMessage === "extendedTextMessage") {
              text = messageData.extendedTextMessageData?.text || "";
            }

            const messageId = body.idMessage;

            if (chatId && text && messageId) {
              const incomingMsg = {
                id: messageId,
                sender: "in",
                text: text,
                timestamp: new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                timestampRaw: Date.now(),
              };

              setChats((prevChats) => {
                const existingChatIndex = prevChats.findIndex(
                  (c) => c.id === chatId,
                );
                if (existingChatIndex >= 0) {
                  const updated = [...prevChats];
                  const chat = updated[existingChatIndex];

                  if (chat.messages.some((m) => m.id === messageId)) {
                    return prevChats;
                  }

                  updated[existingChatIndex] = {
                    ...chat,
                    messages: [...chat.messages, incomingMsg],
                    lastMessage: text,
                    timestamp: incomingMsg.timestamp,
                  };
                  return updated;
                } else {
                  const newChat = {
                    id: chatId,
                    name: chatId.replace("@c.us", "").replace("@g.us", ""),
                    messages: [incomingMsg],
                    lastMessage: text,
                    timestamp: incomingMsg.timestamp,
                  };
                  return [newChat, ...prevChats];
                }
              });
            }
          }

          await deleteNotification(idInstance, apiTokenInstance, receiptId);
        }
      } catch (err) {
        console.error("Polling error:", err);
      } finally {
        isPollingRef.current = false;
      }
    };

    pollingRef.current = setInterval(poll, 4000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [instanceState, idInstance, apiTokenInstance]);

  const checkNewMessages = async () => {
    try {
      const notif = await receiveNotification(idInstance, apiTokenInstance);
      if (notif && notif.receiptId) {
        const { receiptId, body } = notif;
        if (body && body.typeWebhook === "incomingMessageReceived") {
          const senderData = body.senderData || {};
          const messageData = body.messageData || {};
          let chatId = senderData.chatId || body.chatId;
          if (senderData.senderPhoneNumber) {
            chatId = `${senderData.senderPhoneNumber}@c.us`;
          } else if (senderData.sender && senderData.sender.includes("@c.us")) {
            chatId = senderData.sender;
          } else if (
            chatId &&
            !chatId.includes("@") &&
            /^\d{10,15}$/.test(chatId)
          ) {
            chatId = `${chatId}@c.us`;
          }

          let text = "";
          if (messageData.typeMessage === "textMessage") {
            text = messageData.textMessageData?.textMessage || "";
          } else if (messageData.typeMessage === "extendedTextMessage") {
            text = messageData.extendedTextMessageData?.text || "";
          }

          const messageId = body.idMessage;

          if (chatId && text && messageId) {
            const incomingMsg = {
              id: messageId,
              sender: "in",
              text: text,
              timestamp: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              timestampRaw: Date.now(),
            };

            setChats((prevChats) => {
              const existingChatIndex = prevChats.findIndex(
                (c) => c.id === chatId,
              );
              if (existingChatIndex >= 0) {
                const updated = [...prevChats];
                const chat = updated[existingChatIndex];

                if (chat.messages.some((m) => m.id === messageId)) {
                  return prevChats;
                }

                updated[existingChatIndex] = {
                  ...chat,
                  messages: [...chat.messages, incomingMsg],
                  lastMessage: text,
                  timestamp: incomingMsg.timestamp,
                };
                return updated;
              } else {
                const newChat = {
                  id: chatId,
                  name: chatId.replace("@c.us", "").replace("@g.us", ""),
                  messages: [incomingMsg],
                  lastMessage: text,
                  timestamp: incomingMsg.timestamp,
                };
                return [newChat, ...prevChats];
              }
            });
          }
        }
        await deleteNotification(idInstance, apiTokenInstance, receiptId);
        alert("Новое сообщение получено и добавлено в чат!");
      } else {
        alert("В очереди GREEN-API нет новых сообщений.");
      }
    } catch (err) {
      alert(`Ошибка при проверке сообщений: ${err.message}`);
    }
  };

  // Create new chat
  const handleCreateChat = (phoneInput) => {
    if (!phoneInput.trim()) return;

    let inputVal = phoneInput.trim();
    let chatId = inputVal;
    if (!inputVal.includes("@")) {
      const cleanPhone = inputVal.replace(/\D/g, "");
      if (!cleanPhone) {
        return { success: false, error: "Некорректный номер телефона" };
      }
      if (cleanPhone.length < 10) {
        return {
          success: false,
          error: "Номер слишком короткий (минимум 10 цифр)",
        };
      }
      if (cleanPhone.length > 15) {
        return {
          success: false,
          error: "Номер слишком длинный (максимум 15 цифр)",
        };
      }
      chatId = `${cleanPhone}@c.us`;
    }

    // Check for duplicate
    const isDuplicate = chats.some((c) => c.id === chatId);
    if (isDuplicate) {
      return { success: false, error: "Чат с этим номером уже существует" };
    }

    const newChat = {
      id: chatId,
      name: chatId.replace("@c.us", "").replace("@g.us", ""),
      messages: [],
      lastMessage: "Чат создан",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setChats((prev) => [newChat, ...prev]);
    setActiveChatId(chatId);
    setShowNewChatModal(false);

    return { success: true };
  };

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeChatId) return;

    const text = messageInput.trim();
    setMessageInput("");

    try {
      const res = await sendMessage(
        idInstance,
        apiTokenInstance,
        activeChatId,
        text,
      );
      const serverMessageId =
        res?.idMessage || Date.now().toString() + Math.random();

      const outMsg = {
        id: serverMessageId,
        sender: "out",
        text: text,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        timestampRaw: Date.now(),
      };

      setChats((prev) =>
        prev.map((chat) => {
          if (chat.id === activeChatId) {
            if (chat.messages.some((m) => m.id === serverMessageId)) {
              return chat;
            }
            return {
              ...chat,
              messages: [...chat.messages, outMsg],
              lastMessage: text,
              timestamp: outMsg.timestamp,
            };
          }
          return chat;
        }),
      );
    } catch (err) {
      setErrorBanner(`Не удалось отправить сообщение: ${err.message}`);
    }
  };

  // Simulate incoming test reply
  const handleSimulateReply = () => {
    const simMsg = {
      id: Date.now().toString(),
      sender: "in",
      text: "Привет! Это тестовый ответ от получателя в МАКС.",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      timestampRaw: Date.now(),
    };
    setChats((prev) =>
      prev.map((c) =>
        c.id === activeChatId
          ? {
              ...c,
              messages: [...c.messages, simMsg],
              lastMessage: simMsg.text,
              timestamp: simMsg.timestamp,
            }
          : c,
      ),
    );
  };

  const isAuthorized = instanceState === 'authorized';

  const activeChat = chats.find((c) => c.id === activeChatId);
  const filteredChats = chats.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="max-app-container">
      <div className="max-main-wrapper">
        {isAuthorized && (
          <>
            <Dock
              instanceState={instanceState}
              onOpenSettings={() => setShowSettingsModal(true)}
              onOpenNewChat={() => setShowNewChatModal(true)}
              onOpenLogout={() => setShowLogoutModal(true)}
            />

            <Sidebar
              chats={filteredChats}
              activeChatId={activeChatId}
              onSelectChat={setActiveChatId}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onOpenNewChat={() => setShowNewChatModal(true)}
            />

            {activeChat ? (
              <ChatWindow
                activeChat={activeChat}
                messageInput={messageInput}
                onMessageInputChange={setMessageInput}
                onSendMessage={handleSendMessage}
                onSimulateReply={handleSimulateReply}
                onCheckNewMessages={checkNewMessages}
              />
            ) : (
              <WelcomeScreen
                instanceState={instanceState}
                errorBanner={errorBanner}
                onOpenSettings={() => setShowSettingsModal(true)}
              />
            )}
          </>
        )}

        {!isAuthorized && (
          <SettingsModal
            initialId={idInstance}
            initialToken={apiTokenInstance}
            stateMessage={stateMessage}
            instanceState={instanceState}
            onSave={(id, token) => {
              saveCredentials(id, token);
              setShowSettingsModal(false);
            }}
            onClose={() => {}}
            isForced={true}
          />
        )}

        {isAuthorized && showSettingsModal && (
          <SettingsModal
            initialId={idInstance}
            initialToken={apiTokenInstance}
            stateMessage={stateMessage}
            instanceState={instanceState}
            onSave={(id, token) => {
              saveCredentials(id, token);
              setShowSettingsModal(false);
            }}
            onClose={() => setShowSettingsModal(false)}
            isForced={false}
          />
        )}

        {isAuthorized && showNewChatModal && (
          <NewChatModal
            onCreateChat={handleCreateChat}
            onClose={() => setShowNewChatModal(false)}
          />
        )}

        {isAuthorized && showLogoutModal && (
          <LogoutModal
            onConfirmLogout={() => {
              localStorage.removeItem("green_idInstance");
              localStorage.removeItem("green_apiTokenInstance");
              localStorage.removeItem("green_authorized");
              setActiveChatId(null);
              setIdInstance("");
              setApiTokenInstance("");
              setInstanceState("disconnected");
              setStateMessage("Not connected");
              setShowLogoutModal(false);
              setShowSettingsModal(true);
            }}
            onClose={() => setShowLogoutModal(false)}
          />
        )}
      </div>
    </div>
  );
}
