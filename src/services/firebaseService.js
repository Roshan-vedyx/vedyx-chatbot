import { auth, firestore } from "./firebase";
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
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

export const loginWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Login failed", error);
    return null;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout failed", error);
  }
};

export const fetchChatHistory = async (userId) => {
  try {
    const q = query(
      collection(firestore, "chats"),
      where("userId", "==", userId),
      orderBy("createdAt", "asc")
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data().messages || [];
    }
    return [];
  } catch (error) {
    console.error("Error loading previous messages:", error);
    return [];
  }
};

export const saveMessage = async (userId, userMessage, aiResponse) => {
  try {
    const q = query(collection(firestore, "chats"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);

    let chatDoc;
    let existingMessages = [];

    if (!querySnapshot.empty) {
      chatDoc = querySnapshot.docs[0].ref;
      existingMessages = querySnapshot.docs[0].data().messages || [];
      await updateDoc(chatDoc, {
        messages: [...existingMessages, userMessage, aiResponse],
      });
    } else {
      chatDoc = await addDoc(collection(firestore, "chats"), {
        userId,
        messages: [userMessage, aiResponse],
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error("Error saving messages:", error);
  }
};
