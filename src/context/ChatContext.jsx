import { createContext, useContext, useState, useEffect, useRef } from "react";
import { auth, db } from "../services/firebase";
import { collection, query, where, getDocs, orderBy, addDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import axios from "axios";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const chatWindowRef = useRef(null);

  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);

  const loadPreviousMessages = async (userId) => {
    try {
      const q = query(collection(db, "chats"), where("userId", "==", userId), orderBy("createdAt", "asc"));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const chatData = querySnapshot.docs[0].data();
        setMessages(chatData?.messages || []);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error("Error loading previous messages:", error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { text: input, sender: "user", timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const q = query(collection(db, "chats"), where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      let chatDoc;
      let existingMessages = [];

      if (!querySnapshot.empty) {
        chatDoc = querySnapshot.docs[0].ref;
        existingMessages = querySnapshot.docs[0].data().messages || [];
        await updateDoc(chatDoc, { messages: [...existingMessages, userMessage] });
      } else {
        chatDoc = await addDoc(collection(db, "chats"), {
          userId: user.uid,
          messages: [userMessage],
          createdAt: serverTimestamp(),
        });
      }

      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4o",
          messages: [
            { role: "system", content: "You are Vedyx, a personalized AI tutor." },
            ...existingMessages.map((msg) => ({
              role: msg.sender === "user" ? "user" : "assistant",
              content: msg.text,
            })),
            { role: "user", content: input },
          ],
          temperature: 0.7,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          },
        }
      );

      const aiMessage = response.data.choices[0]?.message?.content || "No response from AI.";
      const aiResponse = { text: aiMessage, sender: "ai", timestamp: new Date() };
      setMessages((prev) => [...prev, aiResponse]);

      if (chatDoc) {
        await updateDoc(chatDoc, { messages: [...existingMessages, userMessage, aiResponse] });
      }
    } catch (error) {
      console.error("Error fetching AI response:", error);
      setMessages((prev) => [...prev, { text: "❌ Error fetching response from OpenAI.", sender: "ai" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ChatContext.Provider value={{ messages, setMessages, input, setInput, loading, sendMessage, chatWindowRef, loadPreviousMessages, user, setUser }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
