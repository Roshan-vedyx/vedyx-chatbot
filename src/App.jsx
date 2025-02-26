import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { db, auth, googleProvider } from "./services/firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signOut 
} from "firebase/auth";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import AuthModal from "./components/AuthModal";
import Chat from "./components/Chat";
import PreferencesForm from "./components/PreferencesForm";
import { Box, Spinner, Text, Button } from "@chakra-ui/react";

function AppContent() {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        loadPreviousMessages(currentUser.uid);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadPreviousMessages = async (userId) => {
    try {
      setIsLoading(true);
      const q = query(
        collection(db, "chats"),
        where("userId", "==", userId),
        orderBy("createdAt", "asc")
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        setMessages(querySnapshot.docs[0].data().messages || []);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
      setError("Error loading messages. Please check your Firestore rules.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);
      setAuthModalOpen(false);
      navigate("/chat");
    } catch (error) {
      console.error("Login error:", error);
      setError("Invalid email or password.");
    }
  };

  const handleEmailSignup = async (email, password) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);
      setAuthModalOpen(false);
      navigate("/preferences");
    } catch (error) {
      console.error("Signup error:", error);
      setError(error.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      setUser(userCredential.user);
      setAuthModalOpen(false);
      navigate("/preferences");
    } catch (error) {
      console.error("Google login error:", error);
      setError("Google login failed.");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setMessages([]);
    navigate("/");
  };

  if (isLoading) {
    return (
      <Box textAlign="center" mt="20">
        <Spinner size="xl" />
      </Box>
    );
  }

  return (
    <Box className="app-container" textAlign="center" p="4">
      <Box className="chat-header" mb="4">
        <Text fontSize="2xl" fontWeight="bold">Vedyx AI Tutor</Text>
        {!user ? (
          <Button colorScheme="blue" onClick={() => setAuthModalOpen(true)}>
            Login / Sign Up
          </Button>
        ) : (
          <Button colorScheme="red" onClick={handleLogout}>
            Logout
          </Button>
        )}
      </Box>

      {error && (
        <Box bg="red.100" p="3" borderRadius="md" mb="4">
          {error}
          <Button size="xs" ml="2" onClick={() => setError(null)}>✕</Button>
        </Box>
      )}

      <Routes>
        <Route path="/" element={<Navigate to="/chat" />} />
        <Route path="/chat" element={<Chat user={user} messages={messages} setMessages={setMessages} />} />
        <Route path="/preferences" element={<PreferencesForm user={user} />} />
      </Routes>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setAuthModalOpen(false)}
        onLogin={handleEmailLogin} 
        onSignup={handleEmailSignup} 
        onGoogleLogin={handleGoogleLogin} 
      />
    </Box>
  );
}

function App() {
  return <Router><AppContent /></Router>;
}

export default App;
