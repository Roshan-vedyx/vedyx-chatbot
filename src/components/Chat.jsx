// Chat.jsx - Updated to Load Chat Sessions on Click
import { useState, useEffect, useRef } from "react";
import ChatInterface from "./ChatInterface";
import ChatHistory from "./ChatHistory";
import GuestLimitHandler from "./GuestLimitHandler";
import { useUser } from "@clerk/clerk-react";
import { fetchChatHistory, storeMessage } from "../services/FirestoreUtils";
import { handleUserMessage } from "../services/ChatLogic";

const Chat = ({ setAuthMode, setAuthModalOpen }) => {
  const { user, isSignedIn } = useUser();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [guestMessageCount, setGuestMessageCount] = useState(0);
  const initialized = useRef(false);
  
  // Load chat history only when a session is clicked
  const loadChatSession = (session) => {
    setMessages(session.messages);
  };

  // Handle guest message limit
  const handleGuestMessage = () => {
    if (guestMessageCount >= 5) {
      setAuthMode("signup");
      setAuthModalOpen(true);
      return;
    }
    setGuestMessageCount(prev => prev + 1);
  };

  // Handle sending message
  const sendMessage = async () => {
    if (!input.trim() || loading || (!isSignedIn && guestMessageCount >= 5)) return;
    
    const message = { text: input, sender: "user", timestamp: new Date() };
    setInput("");
    setMessages(prev => [...prev, message]);
    
    let aiMessage = null;
    if (isSignedIn) {
      storeMessage(user?.primaryEmailAddress?.emailAddress, message);
      aiMessage = await handleUserMessage(message);
      storeMessage(user?.primaryEmailAddress?.emailAddress, aiMessage);
    } else {
      aiMessage = await handleUserMessage(message);  // Allow AI response for guests
      handleGuestMessage();  // Increment guest count *after* AI response
    }

    setMessages(prev => [...prev, aiMessage]);
  };

  return (
    <div>
      <ChatHistory user={user} loadChatSession={loadChatSession} />
      <ChatInterface
        messages={messages}
        input={input}
        setInput={setInput}
        sendMessage={sendMessage}
        loading={loading}
      />
      <GuestLimitHandler 
        isGuest={!isSignedIn} 
        guestMessageCount={guestMessageCount} // Pass the actual count
        setAuthMode={setAuthMode} 
        setAuthModalOpen={setAuthModalOpen} 
      />
    </div>
  );
};

export default Chat;