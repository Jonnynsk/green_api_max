export interface StateInstanceResponse {
  stateInstance:
    | "authorized"
    | "notAuthorized"
    | "blocked"
    | "sleepMode"
    | "starting";
}

export interface SendMessageResponse {
  idMessage: string;
}

export interface WebhookBody {
  typeWebhook: string;
  chatId?: string;
  senderData?: {
    chatId: string;
    sender: string;
    senderName: string;
  };
  messageData?: {
    typeMessage: string;
    textMessageData?: {
      textMessage: string;
    };
    extendedTextMessageData?: {
      text: string;
    };
  };
  [key: string]: unknown;
}

export interface NotificationResponse {
  receiptId: number;
  body: WebhookBody;
}

export interface DeleteNotificationResponse {
  result: boolean;
}
