import { useState, useEffect, useRef } from "react";
import axios from "axios";
import ChatInterface from "./ChatInterface";
import GuestLimitHandler from "./GuestLimitHandler";
import { useUser } from "@clerk/clerk-react"; // Clerk authentication

const Chat = ({ setAuthMode, setAuthModalOpen }) => {
  const { user, isSignedIn } = useUser(); // Clerk user state
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [userName, setUserName] = useState("Student");
  const [error, setError] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(!isSignedIn);
  const initialized = useRef(false);
  const anonymousMessagesRef = useRef([]);

  const guestLimitHandler = GuestLimitHandler({
    isGuest: isAnonymous,
    onLimitReached: () => {
      setShowHardLimit(true);
      setAiResponseBlurred(true);
    },
  });

  const [showPopup, setShowPopup] = useState(false);
  const [showHardLimit, setShowHardLimit] = useState(false);
  const [aiResponseBlurred, setAiResponseBlurred] = useState(false);

  const systemPrompt = "You are Vedyx, a personalized AI tutor...";

  useEffect(() => {
    if (isSignedIn && !initialized.current) {
      initialized.current = true;
      setUserName(user?.fullName || "Student");
    } else if (!isSignedIn && !initialized.current) {
      initialized.current = true;
      setMessages([{ sender: "ai", text: `What do you want to learn today, ${userName}? 😊`, timestamp: new Date() }]);
      anonymousMessagesRef.current = [{ sender: "ai", text: `What do you want to learn today, ${userName}? 😊`, timestamp: new Date() }];
    }
  }, [user, isSignedIn]);

  useEffect(() => {
    if (isSignedIn && isAnonymous) {
      setIsAnonymous(false);
    }
  }, [isSignedIn]);

  const sendMessage = async () => {
    if (!input.trim() || loading || showHardLimit) return;

    const userMessage = { text: input, sender: "user", timestamp: new Date() };
    setInput("");
    setMessages(prevMessages => [...prevMessages, userMessage]);

    if (isAnonymous) {
      guestLimitHandler.handleNewMessage();
      if (guestLimitHandler.showSignupPrompt) {
        setShowPopup(true);
      }
    }

    const thinkingMessage = { text: "Thinking...", sender: "ai", timestamp: new Date() };
    setMessages(prevMessages => [...prevMessages, thinkingMessage]);

    try {
      const contextMessages = messages.concat(userMessage).slice(-5).map((msg) => ({
        role: msg.sender === "user" ? "user" : "assistant",
        content: msg.text,
      }));

      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4",
          messages: [{ role: "system", content: systemPrompt }, ...contextMessages],
          temperature: 0.7,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          },
        }
      );

      const aiMessage = {
        text: response.data.choices[0]?.message?.content || "No response from AI.",
        sender: "ai",
        timestamp: new Date(),
      };

      setMessages(prevMessages =>
        prevMessages.map(msg => (msg.text === "Thinking..." && msg.sender === "ai" ? aiMessage : msg))
      );
    } catch (error) {
      console.error("Error in chat:", error);
      setError("Error communicating with AI. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <ChatInterface
        user={user}
        messages={messages}
        input={input}
        setInput={setInput}
        sendMessage={sendMessage}
        loading={loading}
        chatHistory={isAnonymous ? [] : chatHistory}
        error={error}
        isAnonymous={isAnonymous}
      />
      {showPopup && (
        <div style={{ position: "absolute", bottom: "50px", left: "50%", transform: "translateX(-50%)", backgroundColor: "#fff", padding: "12px 16px", borderRadius: "8px", boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)", zIndex: 100 }}>
          <p style={{ fontSize: "14px", marginBottom: "8px", color: "#333" }}>
            Vedyx learns with you! Save your progress by signing up—it's FREE.
          </p>
          <button
            style={{ backgroundColor: "teal", color: "white", padding: "8px 12px", borderRadius: "6px", border: "none", cursor: "pointer", marginRight: "10px" }}
            onClick={() => {
              setAuthMode("signup");
              setAuthModalOpen(true);
            }}
          >
            Sign Up Now
          </button>
          <button style={{ backgroundColor: "transparent", color: "teal", border: "none", cursor: "pointer", textDecoration: "underline" }} onClick={() => setShowPopup(false)}>
            Maybe Later
          </button>
        </div>
      )}
    </div>
  );
};

export default Chat;
