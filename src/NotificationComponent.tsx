import React, { useEffect, useState } from "react";
import * as signalR from "@microsoft/signalr";

interface NotificationComponentProps {
  accessToken: string;
}

const NotificationComponent: React.FC<NotificationComponentProps> = ({
  accessToken,
}) => {
  const [connection, setConnection] = useState<signalR.HubConnection | null>(
    null
  );
  const [notification, setNotification] = useState<string | null>(null);
  const [ChatMessages, setChatMessages] = useState<string[]>([]);

  const connect = () => {
    if (accessToken) {
      if (!connection) {
        const url = "https://192.168.1.224:8086/realtime/notificationHub";

        // Create a new SignalR connection
        const newConnection = new signalR.HubConnectionBuilder()
          .withUrl(url as string, {
            accessTokenFactory: () => accessToken as string,
            transport:
              signalR.HttpTransportType.WebSockets |
              signalR.HttpTransportType.LongPolling,
          })
          .configureLogging(signalR.LogLevel.Information)
          .withAutomaticReconnect()
          .build();

        // Start the connection
        newConnection
          .start()
          .then(() => {
            console.log(`6ixGo signalR connection established.`);
            setConnection(newConnection);
          })
          .catch((error) => {
            console.error("SignalR connection error:", error);
          });

        newConnection.on("Chat_NewMessageEvent", (metaData: object) => {
          console.log(`Chat_NewMessageEvent: ${JSON.stringify(metaData)}`);
        });

        newConnection.on(
          "Chat_MarkSeenConversationEvent",
          (metaData: object) => {
            console.log(
              `Chat_MarkSeenConversationEvent: ${JSON.stringify(metaData)}`
            );
          }
        );

        newConnection.on("Chat_ReactMessageEvent", (metaData: object) => {
          console.log(`Chat_ReactMessageEvent: ${JSON.stringify(metaData)}`);
        });
      }
    } else {
      alert("please login first.");
    }
  };

  const disconnect = () => {
    if (connection) {
      connection.off("Chat_NewMessageEvent");
      connection.off("Chat_MarkSeenConversationEvent");
      connection.off("Chat_ReactMessageEvent");
      connection.stop();
      setConnection(null);
    }
  };

  return (
    <>
      <div>
        <button onClick={connect}>Connect</button>
        <button onClick={disconnect}>Disconnect</button>
      </div>
      <br />
      <div>
        {ChatMessages.map((item, index) => (
          <span key={index}>{item}</span>
        ))}
      </div>
    </>
  );
};

export default NotificationComponent;
