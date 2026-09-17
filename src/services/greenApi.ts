import {
  DeleteNotificationResponse,
  NotificationResponse,
  SendMessageResponse,
  StateInstanceResponse,
} from "./types/greenApi";

const getBaseUrl = (idInstance: string): string => {
  if (!idInstance || idInstance.trim().length < 4) {
    throw new Error("Invalid idInstance: must be at least 4 characters long.");
  }
  const prefix = idInstance.trim().slice(0, 4);
  return `https://${prefix}.api.green-api.com/waInstance${idInstance.trim()}`;
};

export async function getStateInstance(
  idInstance: string,
  apiTokenInstance: string,
): Promise<StateInstanceResponse> {
  const url = `${getBaseUrl(idInstance)}/getStateInstance/${apiTokenInstance.trim()}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Failed to get state instance: ${response.status} ${response.statusText}`,
      );
    }
    return (await response.json()) as StateInstanceResponse;
  } catch (error) {
    console.error("getStateInstance failed:", error);
    throw error;
  }
}

export async function sendMessage(
  idInstance: string,
  apiTokenInstance: string,
  chatId: string,
  message: string,
): Promise<SendMessageResponse> {
  let formattedChatId = chatId.trim();

  if (!formattedChatId.includes("@")) {
    const cleanPhone = formattedChatId.replace(/\D/g, "");
    if (!cleanPhone) {
      throw new Error("Invalid chatId: no digits found.");
    }
    formattedChatId = `${cleanPhone}@c.us`;
  }

  const url = `${getBaseUrl(idInstance)}/sendMessage/${apiTokenInstance.trim()}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chatId: formattedChatId,
        message: message.trim(),
      }),
    });

    if (!response.ok) {
      const errData = await response.text();
      throw new Error(`Failed to send message: ${response.status} ${errData}`);
    }

    return (await response.json()) as SendMessageResponse;
  } catch (error) {
    console.error("sendMessage failed:", error);
    throw error;
  }
}

export async function receiveNotification(
  idInstance: string,
  apiTokenInstance: string,
): Promise<NotificationResponse | null> {
  const url = `${getBaseUrl(idInstance)}/receiveNotification/${apiTokenInstance.trim()}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 204 || response.status === 404) {
        return null;
      }
      throw new Error(
        `Failed to receive notification: ${response.status} ${response.statusText}`,
      );
    }

    return (await response.json()) as NotificationResponse;
  } catch (error) {
    console.error("receiveNotification failed:", error);
    throw error;
  }
}

export async function deleteNotification(
  idInstance: string,
  apiTokenInstance: string,
  receiptId: number,
): Promise<DeleteNotificationResponse> {
  const url = `${getBaseUrl(idInstance)}/deleteNotification/${apiTokenInstance.trim()}/${receiptId}`;

  try {
    const response = await fetch(url, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(
        `Failed to delete notification: ${response.status} ${response.statusText}`,
      );
    }

    return (await response.json()) as DeleteNotificationResponse;
  } catch (error) {
    console.error("deleteNotification failed:", error);
    throw error;
  }
}
