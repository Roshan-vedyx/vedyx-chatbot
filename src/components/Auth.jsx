import { useState, useEffect } from "react";
import { 
  signInWithGoogle, 
  signOutUser, 
  handleRedirectResult, 
  onAuthStateChange 
} from "../AuthService";
import AuthModal from "./AuthModal"; // Import the modal

const Auth = ({ user, setUser, loadPreviousMessages }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Helper function to safely load previous messages
  const safeLoadMessages = async (uid) => {
    if (typeof loadPreviousMessages === "function") {
      try {
        await loadPreviousMessages(uid);
      } catch (err) {
        console.error("Error loading previous messages:", err);
        setError("Failed to load previous messages.");
      }
    } else {
      console.warn("loadPreviousMessages is not a function. Skipping message load.");
    }
  };

  // Handle redirect login results on mount
  useEffect(() => {
    const handleRedirect = async () => {
      try {
        const redirectUser = await handleRedirectResult();
        if (redirectUser) {
          setUser(redirectUser);
          await safeLoadMessages(redirectUser.uid);
        }
      } catch (error) {
        console.error("Redirect handling error:", error);
        setError("Unable to complete login. Please try again.");
      }
    };

    handleRedirect();
  }, [setUser]);

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (authUser) => {
      if (authUser) {
        setUser(authUser);
        await safeLoadMessages(authUser.uid);
      } else {
        setUser(null);
        setIsAuthModalOpen(true); // Auto-open the AuthModal when user is null
      }
    });

    return () => unsubscribe(); // Cleanup on unmount
  }, [setUser]);

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await signOutUser();
      setUser(null);
      setIsAuthModalOpen(true); // Show login modal after logout
    } catch (error) {
      console.error("Logout error:", error);
      setError("Error logging out. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {error && <div className="error-message">{error}</div>}

      {user ? (
        <div className="user-container">
          {user.photoURL && (
            <img 
              src={user.photoURL} 
              alt="Profile" 
              className="profile-image"
            />
          )}
          <button 
            className="logout-btn"
            onClick={handleLogout}
            disabled={isLoading}
          >
            {isLoading ? "Logging out..." : "Logout"}
          </button>
        </div>
      ) : (
        // No login button; AuthModal will auto-open
        <AuthModal 
          isOpen={isAuthModalOpen} 
          onClose={() => setIsAuthModalOpen(false)} 
          onLogin={() => setIsAuthModalOpen(false)}
          onSignup={() => setIsAuthModalOpen(false)}
          onGoogleLogin={() => setIsAuthModalOpen(false)}
        />
      )}
    </div>
  );
};

export default Auth;
