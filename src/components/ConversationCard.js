import React, { useState } from "react";
import MessageHistory from "./MessageHistory";
import { CopyableField } from "./CopyableField";
import { buildProductHref } from "./MessageHistory";

const ConversationCard = ({ conversation, countryCode }) => {
  const { sender, receiver, message, productInfo } = conversation;
  const [showMessages, setShowMessages] = useState(false);

  const toggleMessages = () => {
    setShowMessages((prev) => !prev);
  };

  const getRole = (roles) => (roles.includes("Seller") ? "Seller" : "Buyer");

  return (
    <div className="conversation-card bg-white shadow-lg rounded-lg p-3 sm:p-5 mb-3 sm:mb-5">
      <div onClick={toggleMessages} className="cursor-pointer">
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
              <h3 className="font-semibold text-gray-800 text-lg ml-2 min-w-0" title={`${sender.firstName ?? ""}${sender.middleName ?? ""}${sender.lastName ?? ""}`}>
                <span className="block truncate sm:overflow-visible sm:whitespace-normal">
                  {`${sender.firstName ?? ""}${sender.middleName ?? ""}${sender.lastName ?? ""
                    }` || sender.email}
                </span>
              </h3>
            </div>
            <CopyableField value={sender.email} label="Email" />
            <CopyableField value={sender.phone} label="Phone" />
          </div>

          <div className="hidden sm:flex items-center mx-4 shrink-0">
            <span className="text-gray-500 text-2xl">→</span>
          </div>

          <div className="flex-1 min-w-0 border-t sm:border-t-0 pt-2 sm:pt-0">
            <div className="flex items-center min-w-0">
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 ${getRole(receiver.roles) === "Seller"
                  ? "bg-blue-100 text-blue-600"
                  : "bg-green-100 text-green-600"
                  }`}
              >
                {getRole(receiver.roles)}
              </span>
              <h3 className="font-semibold text-gray-800 text-lg ml-2 min-w-0" title={`${receiver.firstName ?? ""}${receiver.middleName ?? ""}${receiver.lastName ?? ""}`}>
                <span className="block truncate sm:overflow-visible sm:whitespace-normal">
                  {`${receiver.firstName ?? ""}${receiver.middleName ?? ""}${receiver.lastName ?? ""
                    }` || receiver.email}
                </span>
              </h3>
            </div>
            <CopyableField value={receiver.email} label="Email" />
            <CopyableField value={receiver.phone} label="Phone" />
          </div>
        </div>

        <div className="mt-4">
          {
            productInfo && (<div className="text-gray-700">
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
          <div className="text-gray-700 mt-2">
            <CopyableField value={message.content} label="Last message" />
          </div>
          <div className="text-sm text-gray-500 mt-2">
            {new Date(message.createdTs).toLocaleString()}
          </div>
        </div>
      </div>

      {
        showMessages && (
          <MessageHistory
            conversationId={conversation.conversationId}
            conversation={conversation}
            countryCode={countryCode}
          />
        )
      }
    </div >
  );
};

export default ConversationCard;
