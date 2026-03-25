import React, { useState, useRef } from "react";
import MessageHistory from "./MessageHistory";
import { CopyableField } from "./CopyableField";
import { buildProductHref } from "./MessageHistory";

const ConversationCard = ({ conversation, countryCode, isSelected, onSelect }) => {
  const { sender, receiver, message, productInfo } = conversation;
  const [showMessages, setShowMessages] = useState(false);
  const cardRef = useRef(null);

  const openMessages = () => {
    onSelect?.(conversation.conversationId);
    setShowMessages(true);
  };

  const closeMessages = () => {
    setShowMessages(false);
  };

  const getRole = (roles) => (roles.includes("Seller") ? "Seller" : "Buyer");

  return (
    <div ref={cardRef} className={`conversation-card rounded-lg p-3 sm:p-5 mb-3 sm:mb-5 transition-all duration-200 border-l-4 ${
      isSelected
        ? 'bg-blue-50 shadow-xl border-l-blue-500 ring-1 ring-blue-200'
        : 'bg-white shadow-lg border-l-transparent hover:shadow-xl hover:border-l-gray-300 hover:bg-gray-50'
    }`}>
      <div onClick={openMessages} className="cursor-pointer">
        <div
          className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-7"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center min-w-0">
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 ${getRole(sender.roles) === "Seller"
                  ? "bg-blue-100 text-blue-600"
                  : "bg-green-100 text-green-600"
                  }`}
              >
                {getRole(sender.roles)}
              </span>
              <h3 className="font-semibold text-gray-800 text-lg ml-2 min-w-0 break-words">
                {`${sender.firstName ?? ""}${sender.middleName ?? ""}${sender.lastName ?? ""
                  }` || sender.email}
              </h3>
            </div>
            <CopyableField value={sender.email} label="Email" />
            <CopyableField value={sender.phone} label="Phone" />
          </div>

          <div className="flex items-center shrink-0 sm:mx-4 justify-center py-1 sm:py-0">
            <span className="text-gray-800 text-xs block sm:hidden"><b>↓</b></span>
            <span className="text-gray-500 text-2xl hidden sm:block">→</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center min-w-0">
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 ${getRole(receiver.roles) === "Seller"
                  ? "bg-blue-100 text-blue-600"
                  : "bg-green-100 text-green-600"
                  }`}
              >
                {getRole(receiver.roles)}
              </span>
              <h3 className="font-semibold text-gray-800 text-lg ml-2 min-w-0 break-words">
                {`${receiver.firstName ?? ""}${receiver.middleName ?? ""}${receiver.lastName ?? ""
                  }` || receiver.email}
              </h3>
            </div>
            <CopyableField value={receiver.email} label="Email" />
            <CopyableField value={receiver.phone} label="Phone" />
          </div>
        </div>

        <div className="mt-4">
          {
            productInfo && (
            <div className="text-gray-700 border border-gray-200 rounded-lg p-3 mt-2">
              <div className="font-medium">Marketplace:</div>
              <div>
                <i style={{ color: "blue" }}>
                  <a
                    href={buildProductHref(
                      productInfo.slug,
                      productInfo.parentCategoryCode
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-800"
                  >
                    {productInfo.name}
                  </a>
                </i>
              </div>
              <div>
                <i style={{ color: "blue" }}>
                  <CopyableField
                    value={productInfo.productId}
                    label="Product Id"
                  /></i>
              </div>
              <div>
                <span className="text-sm text-gray-600 font-medium mr-2">Status:</span>
                <i>
                  <b style={{ color: "orange" }}>{productInfo.statusText}</b>
                </i>
              </div>
            </div>
            )
          }
          <div className="text-sm text-gray-900 mt-4">
            <CopyableField value={message.content} />
          </div>
          <div className="text-sm text-gray-400 mt-1">
            {new Date(message.createdTs).toLocaleString()}
          </div>
        </div>
      </div>

      {showMessages && (
          <MessageHistory
            conversationId={conversation.conversationId}
            conversation={conversation}
            countryCode={countryCode}
            onClose={closeMessages}
          />
        )}
    </div >
  );
};

export default ConversationCard;
