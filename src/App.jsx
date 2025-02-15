import { useState, useEffect, useRef } from "react";
import { auth, firestore } from "./firebase";
import { signInWithRedirect, GoogleAuthProvider, signOut } from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  addDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import axios from "axios";
import Markdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import PreferencesForm from './PreferencesForm';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const chatWindowRef = useRef(null);
  const navigate = useNavigate(); // Now useNavigate() works fine

  const userPreferences = {
    subject: "science",
    interests: ["space", "biology"],
    learningStyle: "visual",
  };

  const systemPrompt = `You are Vedyx, a highly personalized AI tutor. The user wants to learn about ${userPreferences.subject}.
    - If teaching math, return equations in LaTeX format.
    - If teaching science, use real-world analogies and experiments.
    - If teaching history, use storytelling and emphasize key historical events.
    - Adapt to the user’s interests: ${userPreferences.interests.join(", ")}.
    - Use ${userPreferences.learningStyle} methods where possible.
    Ask engaging follow-up questions to deepen understanding.`;

  useEffect(() => {
    auth.onAuthStateChanged((authUser) => {
      setUser(authUser);
      if (authUser) {
        loadPreviousMessages(authUser.uid);
      } else {
        setMessages([]);
      }
    });

    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, []);

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithRedirect(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setMessages([]);
    navigate("/login"); // Redirect user to login page after logout
  };

  const loadPreviousMessages = async (userId) => {
    // Load previous messages logic here
  };

  const sendMessage = async () => {
    // Send message logic here
  };

  return (
    <Routes>
      <Route path="/" element={user ? (
        <div className="chat-container">
          {/* Chat UI */}
        </div>
      ) : (
        <Navigate to="/login" />
      )} />
      <Route path="/login" element={
        <div className="login-container">
          <h1>Please Login</h1>
          <button className="login-btn" onClick={loginWithGoogle}>Login with Google</button>
        </div>
      } />
      <Route path="/preferences" element={user ? <PreferencesForm /> : <Navigate to="/login" />} />
    </Routes>
  );
}

export default App;
