// FirestoreUtils.js - Handles Firestore interactions 
import { db } from "../services/firebase";
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from "firebase/firestore";

// ✅ Fetch Chat History on Login
export const fetchChatHistory = async (userEmail, setMessages) => {
  if (!userEmail) return;
  const userRef = doc(db, "users", userEmail);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    const userData = userSnap.data();
    setMessages(userData.chat_history || []);
  } else {
    // Ensure user document is initialized properly
    await setDoc(userRef, {
      chat_history: [],
      created_at: new Date(),
      preferences: {}
    });
  }
};

// ✅ Store Messages in Firestore
export const storeMessage = async (userEmail, message) => {
  if (!userEmail) return;
  const userRef = doc(db, "users", userEmail);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    // Create user document if it doesn't exist
    await setDoc(userRef, { chat_history: [message], created_at: new Date(), preferences: {} });
  } else {
    await updateDoc(userRef, {
      chat_history: arrayUnion(message)
    });
  }
};

// ✅ Store User Preferences (Called at an appropriate time)
export const storePreference = async (userEmail, key, value) => {
  if (!userEmail) return;
  const userRef = doc(db, "users", userEmail);
  await updateDoc(userRef, {
    [`preferences.${key}`]: value
  });
};

// ✅ Fetch Chat Sessions for Sidebar
export const fetchChatSessions = async (userEmail, setChatSessions) => {
  if (!userEmail) return;
  const userRef = doc(db, "users", userEmail);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const userData = userSnap.data();
    const chatHistory = userData.chat_history || [];

    // Group chats into sessions by date (Assuming one session per day)
    const sessionsMap = {};
    chatHistory.forEach((message) => {
      const date = new Date(message.timestamp.seconds * 1000).toLocaleDateString();
      if (!sessionsMap[date]) {
        sessionsMap[date] = { date, messages: [] };
      }
      sessionsMap[date].messages.push(message);
    });

    // Convert the object to an array of sessions
    const sessionsArray = Object.values(sessionsMap);
    setChatSessions(sessionsArray);
  } else {
    setChatSessions([]);
  }
};