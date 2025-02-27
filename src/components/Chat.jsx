import { useState, useEffect, useRef } from "react";
import { db } from "../services/firebase";
import {
  collection,
  doc,
  query,
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
import GuestLimitHandler from "./GuestLimitHandler";

const Chat = ({ user }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [userName, setUserName] = useState("Student");
  const [error, setError] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(!user);
  const initialized = useRef(false);
  const anonymousMessagesRef = useRef([]);

  const [showPopup, setShowPopup] = useState(false);
  const [showHardLimit, setShowHardLimit] = useState(false);
  const [aiResponseBlurred, setAiResponseBlurred] = useState(false);
  const guestLimitHandler = GuestLimitHandler({
    onLimitReached: () => {
      setShowHardLimit(true);
      setAiResponseBlurred(true);
    },
  });

  const systemPrompt = "You are Vedyx, a personalized AI tutor...";

  useEffect(() => {
    if (!isAnonymous && user && !initialized.current) {
      initialized.current = true;
      fetchUserData();
    } else if (isAnonymous && !initialized.current) {
      initialized.current = true;
      // Set up anonymous chat
      setMessages([{ sender: "ai", text: `What do you want to learn today, ${userName}? 😊`, timestamp: new Date() }]);
      anonymousMessagesRef.current = [{ sender: "ai", text: `What do you want to learn today, ${userName}? 😊`, timestamp: new Date() }];
    }
  }, [user, isAnonymous]);

  // If user logs in during an anonymous session
  useEffect(() => {
    if (user && isAnonymous) {
      setIsAnonymous(false);
      initialized.current = false; // Reset initialization to fetch user data
    }
  }, [user]);

  useEffect(() => {
    if (!isAnonymous && currentChatId) {
      loadChat(currentChatId);
    }
  }, [currentChatId, isAnonymous]);

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
      setError("Error loading user data. Please refresh.");
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
    if (!user) {
      // For anonymous users, just reset messages
      setMessages([{ sender: "ai", text: `What do you want to learn today, ${userName}? 😊`, timestamp: new Date() }]);
      anonymousMessagesRef.current = [{ sender: "ai", text: `What do you want to learn today, ${userName}? 😊`, timestamp: new Date() }];
      return;
    }
    
    try {
      const chatRef = await addDoc(collection(db, `users/${user.uid}/chats`), {
        title: "New Chat",
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
      setCurrentChatId(chatRef.id);
      setMessages([{ sender: "ai", text: `What do you want to learn today, ${userName}? 😊`, timestamp: new Date() }]);
      await addDoc(collection(chatRef, "messages"), {
        sender: "ai",
        text: `What do you want to learn today, ${userName}? 😊`,
        timestamp: new Date(),
      });
      await fetchChatHistory();
      setError("");
    } catch (error) {
      console.error("Error starting new chat:", error);
      setError("Error starting a new chat. Please try again.");
    }
  };

  const loadChat = async (chatId) => {
    if (!user || !chatId) return;
    try {
      setError("");
      const chatRef = doc(db, `users/${user.uid}/chats/${chatId}`);
      const messagesQuery = query(collection(chatRef, "messages"), orderBy("timestamp", "asc"));
      const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        const chatMessages = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
        setMessages(chatMessages);
      });
      return () => unsubscribe();
    } catch (error) {
      console.error("Error loading messages:", error);
      setError("Error loading messages. Please try again.");
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading || showHardLimit) return; // Add showHardLimit check
  
    const userMessage = { text: input, sender: "user", timestamp: new Date() };
    setInput("");
  
    if (isAnonymous) {
      // Handle anonymous chat (no Firebase)
      setMessages(prevMessages => [...prevMessages, userMessage]);
      anonymousMessagesRef.current = [...anonymousMessagesRef.current, userMessage];
  
      // Call guestLimitHandler to increment message count for anonymous user
      guestLimitHandler.handleNewMessage(); // Increment message count
  
      // Show the signup prompt if the user has reached their limit
      if (guestLimitHandler.showSignupPrompt) {
        setShowPopup(true); // This will show the sign-up prompt
      }
  
      // Add thinking message
      const thinkingMessage = { text: "Thinking...", sender: "ai", timestamp: new Date() };
      setMessages(prevMessages => [...prevMessages, thinkingMessage]);
  
      try {
        const contextMessages = anonymousMessagesRef.current.slice(-5).map((msg) => ({
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
  
        // Replace thinking message with actual response
        setMessages(prevMessages =>
          prevMessages.map(msg =>
            msg.text === "Thinking..." && msg.sender === "ai" ? aiMessage : msg
          )
        );
        anonymousMessagesRef.current = [...anonymousMessagesRef.current.filter(msg => msg.text !== "Thinking..."), aiMessage];
  
        // Stop if the hard limit has been reached
        if (showHardLimit) return; // Stop further action
  
      } catch (error) {
        console.error("Error in anonymous chat:", error);
        setError("Error communicating with AI. Please try again.");
        // Remove the thinking message
        setMessages(prevMessages => prevMessages.filter(msg => msg.text !== "Thinking..."));
      } finally {
        setLoading(false);
      }
  
      return;
    }
  
    // Handle authenticated chat with Firebase
    try {
      // Call guestLimitHandler to increment message count for authenticated user
      guestLimitHandler.handleNewMessage(); // Increment message count
  
      // Show the signup prompt if the user has reached their limit
      if (guestLimitHandler.showSignupPrompt) {
        setShowPopup(true); // This will show the sign-up prompt
      }
  
      if (!currentChatId) {
        // If currentChatId is null but user is authenticated, start a new chat
        const chatRef = await addDoc(collection(db, `users/${user.uid}/chats`), {
          title: input.slice(0, 30) + (input.length > 30 ? "..." : ""),
          userId: user.uid,
          createdAt: serverTimestamp(),
        });
        setCurrentChatId(chatRef.id);
        await fetchChatHistory();
  
        // Add the user message
        await addDoc(collection(chatRef, "messages"), userMessage);
  
        // Add thinking message
        const thinkingMessage = { text: "Thinking...", sender: "ai", timestamp: new Date() };
        const thinkingDoc = await addDoc(collection(chatRef, "messages"), thinkingMessage);
  
        // Context is just the user message since this is a new chat
        const contextMessages = [{
          role: "user",
          content: userMessage.text,
        }];
  
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
  
        await updateDoc(doc(collection(chatRef, "messages"), thinkingDoc.id), aiMessage);
  
        // Stop if the hard limit has been reached
        if (showHardLimit) return; // Stop further action
  
      } else {
        const chatRef = doc(db, `users/${user.uid}/chats/${currentChatId}`);
        const messagesRef = collection(chatRef, "messages");
        await addDoc(messagesRef, userMessage);
  
        const chatDoc = await getDoc(chatRef);
        if (chatDoc.exists() && chatDoc.data().title === "New Chat") {
          await updateDoc(chatRef, { title: input.slice(0, 30) + (input.length > 30 ? "..." : "") });
          fetchChatHistory();
        }
  
        const thinkingMessage = { text: "Thinking...", sender: "ai", timestamp: new Date() };
        const thinkingDoc = await addDoc(messagesRef, thinkingMessage);
  
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
  
        await updateDoc(doc(messagesRef, thinkingDoc.id), aiMessage);
  
        // Stop if the hard limit has been reached
        if (showHardLimit) return; // Stop further action
      }
  
      setError("");
    } catch (error) {
      console.error("Error sending message:", error);
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
      loadChat={isAnonymous ? null : loadChat}
      startNewChat={startNewChat}
      error={error}
      isAnonymous={isAnonymous}
    />

      {showPopup && (
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', bottom: '100%', left: 0, backgroundColor: 'lightgray', padding: '10px' }}>
          Vedyx learns with you! Save your progress by signing up—it's free.
          <button onClick={() => { /* Implement sign-up logic */ }}>Sign Up Now</button>
          <button onClick={() => setShowPopup(false)}>Maybe Later</button>
        </div>
      </div>
      )}
      {showHardLimit && (
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(255, 255, 255, 0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        You've used your free questions for today! Sign up to continue learning.
        <button onClick={() => { /* Implement sign-up logic */ }}>Sign Up for Free</button>
        <p>Come back tomorrow</p>
      </div>
      )}
      {aiResponseBlurred && (
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(255, 255, 255, 0.5)' }}></div>
      )}
  </div>
);

  };
  
  export default Chat;
  