import { createContext, useContext, useState, useEffect } from "react";
import { auth } from "../services/firebase"; // Ensure this correctly imports Firebase auth
import { onAuthStateChanged, signOut } from "firebase/auth";

// Create UserContext
const UserContext = createContext();

// UserContext Provider
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Handles async state changes

  useEffect(() => {
    // Listen for Firebase authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false); // Set loading false when user state is updated
    });

    return () => unsubscribe(); // Cleanup listener
  }, []);

  // Logout function
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  return (
    <UserContext.Provider value={{ user, loading, logout }}>
      {!loading ? children : <div>Loading...</div>}
    </UserContext.Provider>
  );
};

// Hook to use UserContext
export const useUser = () => useContext(UserContext);
