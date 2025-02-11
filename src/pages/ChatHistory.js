import React, { useState, useEffect, useRef } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { getConversations } from "../services/chatService";
import ConversationCard from "../components/ConversationCard";

const pageSize = 10;

const ChatHistory = () => {
  const [conversations, setConversations] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [lateInHours, setLateInHours] = useState(0);
  const [take, setTake] = useState(pageSize);
  const [countryCode, setCountryCode] = useState("VNM");
  const isFetchingRef = useRef(false);

  const fetchConversations = async (_take, reset = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    _take = reset ? pageSize : _take ?? take;

    try {
      const data = await getConversations(lateInHours, _take, undefined, countryCode);
      if (data.details.length > 0) {
        setConversations(data.details);
        setHasMore(data.total >= _take);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    setConversations([]);
    setTake(pageSize);
    setHasMore(true);
    fetchConversations(undefined, true);
  }, [lateInHours, countryCode]);

  const loadMore = async () => {
    if (isFetchingRef.current) return;
    setTake((prev) => prev + pageSize);
    await fetchConversations(take + pageSize);
  };

  return (
    <div className="chat-history-container p-6 bg-gray-50 min-h-screen">
      <div className="filter-container mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Last message of conversations</h1>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="flex-1 flex justify-center">
          <div className="flex items-center">
            <label className="text-gray-600 font-medium mr-2">Country</label>
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="p-2 border rounded-md bg-white text-gray-800"
            >
              <option value="VNM">Vietnam</option>
              <option value="MYS">Malaysia</option>
            </select>
          </div>
        </div>

        <div className="flex items-center">
          <label className="text-gray-600 font-medium mr-2">Waited for a response for at least</label>
          <input
            type="number"
            value={lateInHours}
            onChange={(e) => setLateInHours(Number(e.target.value))}
            className="p-2 border rounded-md w-20 mr-2"
            placeholder="Hours"
          />
          <label className="text-gray-600 font-medium">hours</label>
        </div>
      </div>

      <InfiniteScroll
        dataLength={conversations.length}
        next={loadMore}
        hasMore={hasMore}
        loader={<h4 className="text-center text-gray-500">Loading...</h4>}
        endMessage={<p className="text-center text-gray-600 mt-4">No more conversations</p>}
      >
        {conversations.map((conversation) => (
          <ConversationCard key={conversation.conversationId} conversation={conversation} />
        ))}
      </InfiniteScroll>
    </div>
  );
};

export default ChatHistory;
