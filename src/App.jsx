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
import { Box, Spinner, Text, Button, Flex, IconButton, Avatar, Tooltip, HStack } from "@chakra-ui/react";
import { FaRegFileAlt, FaShareAlt } from "react-icons/fa";

function AppContent() {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");  // NEW: Tracks whether to show login or signup
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
    <Box className="app-container" textAlign="center">
      
      {/* Sticky Header */}
      <Flex 
        className="chat-header" 
        justify="space-between" 
        align="center" 
        p={3} 
        bg="white" 
        boxShadow="md"
        position="sticky"
        top="0"
        zIndex="1000"
      >
        {/* Vedyx Logo / Title */}
        <Text fontSize="xl" fontWeight="bold" ml={4}>
          Vedyx AI Tutor
        </Text>

        {/* Authentication / User Actions */}
        <HStack spacing={4} mr={4}>
          {!isLoading && !user ? (  // Ensure icons don't appear in incognito
            <>
              <Button 
                variant="outline" 
                color="black" 
                borderColor="black" 
                onClick={() => { 
                  setAuthMode("login"); // NEW: Ensure login mode
                  setAuthModalOpen(true);
                }}
              >
                Log In
              </Button>
              <Button 
                colorScheme="teal" 
                onClick={() => {
                  setAuthMode("signup"); // NEW: Ensure signup mode
                  setAuthModalOpen(true);
                }}
              >
                Sign Up
              </Button>
            </>
          ) : user && (
            <>
              <Tooltip label="Resources" hasArrow>
                <IconButton icon={<FaRegFileAlt />} aria-label="Resources" variant="ghost" />
              </Tooltip>
              <Tooltip label="Share" hasArrow>
                <IconButton icon={<FaShareAlt />} aria-label="Share" variant="ghost" />
              </Tooltip>
              <Tooltip label="Profile & Settings" hasArrow>
                <Avatar size="sm" cursor="pointer" onClick={handleLogout} />
              </Tooltip>
            </>
          )}
        </HStack>
      </Flex>

      {/* Error Message */}
      {error && (
        <Box bg="red.100" p="3" borderRadius="md" my={4}>
          {error}
          <Button size="xs" ml="2" onClick={() => setError(null)}>✕</Button>
        </Box>
      )}

      {/* Routes */}
      <Routes>
        <Route path="/" element={<Navigate to="/chat" />} />
        <Route path="/chat" element={<Chat user={user} messages={messages} setMessages={setMessages} />} />
        <Route path="/preferences" element={<PreferencesForm user={user} />} />
      </Routes>

      {/* Authentication Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setAuthModalOpen(false)}
        mode={authMode}  // NEW: Passes "login" or "signup" mode
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
