import { auth, db } from "./services/firebase";
import { 
  signInWithPopup, 
  signInWithRedirect, 
  GoogleAuthProvider, 
  signOut, 
  getRedirectResult, 
  onAuthStateChanged 
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

// Helper function to save user data
const saveUserData = async (user) => {
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL || "",
      createdAt: new Date(),
    });
  }
};

// Google sign-in with popup fallback to redirect
export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    
    provider.setCustomParameters({
      prompt: 'select_account',
      display: 'popup'
    });

    try {
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        await saveUserData(result.user);
        return result.user;
      }
    } catch (popupError) {
      console.warn("Popup failed, falling back to redirect:", popupError);
      await signInWithRedirect(auth, provider);
    }
  } catch (error) {
    console.error("Login failed:", error);
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('The sign-in popup was closed before completing authentication.');
    } else if (error.code === 'auth/popup-blocked') {
      throw new Error('Pop-up was blocked by your browser. Please enable pop-ups for this site.');
    }
    throw error;
  }
};

// Handle redirect result properly
export const handleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result?.user) {
      await saveUserData(result.user);
      return result.user;
    }
    return null; // Explicitly return null if no user is found
  } catch (error) {
    console.error("Redirect result handling failed:", error);
    return null;
  }
};

// Sign out user
export const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout failed:", error);
    throw error;
  }
};

// Listen for auth state changes
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// Helper to check if user is logged in
export const getCurrentUser = () => {
  return auth.currentUser;
};
