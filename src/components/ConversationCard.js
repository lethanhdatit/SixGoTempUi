import React, { useState } from "react";
import MessageHistory from "./MessageHistory";

const ConversationCard = ({ conversation, countryCode }) => {
  const { sender, receiver, message } = conversation;
  const [showMessages, setShowMessages] = useState(false);

  const toggleMessages = () => {
    setShowMessages((prev) => !prev);
  };

  const getRole = (roles) => (roles.includes("Seller") ? "Seller" : "Buyer");

  return (
    <div className="conversation-card bg-white shadow-lg rounded-lg p-5 mb-5">
      <div onClick={toggleMessages} className="cursor-pointer">
        <div style={{ gap: "28px" }} className="flex justify-between items-center">
          <div className="flex-1 mr-4">
            <div className="flex items-center">
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full ${
                  getRole(sender.roles) === "Seller"
                    ? "bg-blue-100 text-blue-600"
                    : "bg-green-100 text-green-600"
                }`}
              >
                {getRole(sender.roles)}
              </span>
              <h3 className="font-semibold text-gray-800 text-lg ml-2">
                {`${sender.firstName ?? ""}${sender.middleName ?? ""}${sender.lastName ?? ""}` || sender.email}
              </h3>
            </div>
            <p className="text-sm text-gray-500">{sender.email}</p>
          </div>

          <div className="flex items-center mx-4">
            <span className="text-gray-500 text-2xl">→</span>
          </div>

          <div className="flex-1">
            <div className="flex items-center">
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full ${
                  getRole(receiver.roles) === "Seller"
                    ? "bg-blue-100 text-blue-600"
                    : "bg-green-100 text-green-600"
                }`}
              >
                {getRole(receiver.roles)}
              </span>
              <h3 className="font-semibold text-gray-800 text-lg ml-2">
                {`${receiver.firstName ?? ""}${receiver.middleName ?? ""}${receiver.lastName ?? ""}` || receiver.email}
              </h3>
            </div>
            <p className="text-sm text-gray-500">{receiver.email}</p>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-gray-700">{message.content}</p>
          <p className="text-sm text-gray-500 mt-2">
            {new Date(message.createdTs).toLocaleString()}
          </p>
        </div>
      </div>

      {showMessages && (
        <MessageHistory conversationId={conversation.conversationId} conversation={conversation} countryCode={countryCode} />
      )}
    </div>
  );
};

export default ConversationCard;
