import { useState, useEffect, useRef } from "react";
import { db } from "../services/firebase";
import {
  collection,
  doc,
  query,
  where,
  orderBy,
  addDoc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
  getDocs,
  getDoc,
} from "firebase/firestore";
import axios from "axios";
import ChatInterface from "./ChatInterface";

const Chat = ({ user }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [userName, setUserName] = useState("");
  const [error, setError] = useState("");
  const chatWindowRef = useRef(null);
  const initialized = useRef(false);

  const systemPrompt = "You are Vedyx, a personalized AI tutor...";

  useEffect(() => {
    if (user && !initialized.current) {
      initialized.current = true;
      fetchUserData();
    }
  }, [user]);

  useEffect(() => {
    if (currentChatId) {
      loadChat(currentChatId);
    }
  }, [currentChatId]);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        setUserName(userSnap.data().name || "Student");
      }

      const chats = await fetchChatHistory();
      
      if (chats.length === 0) {
        await startNewChat();
      } else {
        setCurrentChatId(chats[0].id);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setError("Error loading user data. Please refresh the page.");
    }
  };

  const fetchChatHistory = async () => {
    if (!user) return [];

    try {
      const q = query(
        collection(db, `users/${user.uid}/chats`),
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(q);
      const history = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        title: doc.data().title || "New Chat",
      }));

      setChatHistory(history);
      return history;
    } catch (error) {
      console.error("Error fetching chat history:", error);
      setError("Error loading chat history. Please try again.");
      return [];
    }
  };

  const startNewChat = async () => {
    if (!user) return;

    try {
      const chatRef = await addDoc(collection(db, `users/${user.uid}/chats`), {
        title: "New Chat",
        userId: user.uid,
        createdAt: serverTimestamp(),
      });

      setCurrentChatId(chatRef.id);
      setMessages([
        { sender: "ai", text: `What do you want to learn today, ${userName}? 😊` },
      ]);
      
      // Add welcome message to Firestore
      const messagesRef = collection(chatRef, "messages");
      await addDoc(messagesRef, {
        sender: "ai",
        text: `What do you want to learn today, ${userName}? 😊`,
        timestamp: new Date(),
      });

      await fetchChatHistory();
      setError("");
      return chatRef.id;
    } catch (error) {
      console.error("Error starting new chat:", error);
      setError("Error starting a new chat. Please try again.");
      return null;
    }
  };

  const loadChat = async (chatId) => {
    if (!user || !chatId) return;

    try {
      setError(""); // Clear error before loading
      const chatRef = doc(db, `users/${user.uid}/chats/${chatId}`);
      const messagesQuery = query(
        collection(chatRef, "messages"),
        orderBy("timestamp", "asc")
      );

      const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        const chatMessages = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
        setMessages(chatMessages);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Error loading messages:", error);
      setError("Error loading messages. Please try again.");
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading || !currentChatId) return;

    const userMessage = {
      text: input,
      sender: "user",
      timestamp: new Date(),
    };

    setInput("");
    setLoading(true);

    try {
      const chatRef = doc(db, `users/${user.uid}/chats/${currentChatId}`);
      const messagesRef = collection(chatRef, "messages");

      // Add user message to Firestore
      await addDoc(messagesRef, userMessage);

      // Update chat title if it's the first message
      const chatDoc = await getDoc(chatRef);
      if (chatDoc.exists() && chatDoc.data().title === "New Chat") {
        await updateDoc(chatRef, {
          title: input.slice(0, 30) + (input.length > 30 ? "..." : ""),
        });
        fetchChatHistory();
      }

      // Add thinking message
      const thinkingMessage = {
        text: "Thinking...",
        sender: "ai",
        timestamp: new Date(),
      };
      const thinkingDoc = await addDoc(messagesRef, thinkingMessage);

      // Get context for AI
      const contextMessages = messages
        .concat(userMessage)
        .slice(-5)
        .map((msg) => ({
          role: msg.sender === "user" ? "user" : "assistant",
          content: msg.text,
        }));

      // Get AI response
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

      // Replace thinking message with AI response
      await updateDoc(doc(messagesRef, thinkingDoc.id), aiMessage);
      setError("");
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Error communicating with AI. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ChatInterface
      user={user}
      messages={messages}
      input={input}
      setInput={setInput}
      sendMessage={sendMessage}
      loading={loading}
      chatHistory={chatHistory}
      loadChat={loadChat}
      startNewChat={startNewChat}
      error={error}
    />
  );
};

export default Chat;