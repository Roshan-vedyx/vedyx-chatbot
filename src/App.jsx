import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { auth, db, signInWithGoogle } from "./services/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import AuthModal from "./components/AuthModal";
import Chat from "./components/Chat";
import PreferencesForm from "./components/PreferencesForm";
import { Box, Spinner, Text, Button, Flex, IconButton, Avatar, Tooltip, HStack, useToast } from "@chakra-ui/react";
import { FaRegFileAlt, FaShareAlt } from "react-icons/fa";

function AppContent() {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("\ud83d\udc64 Auth State Changed:", currentUser);
      setUser(currentUser);
      setIsLoading(false);

      if (currentUser) {
        loadPreviousMessages(currentUser.uid);
      } else {
        console.warn("\u26a0\ufe0f No User Logged In");
      }
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
      setMessages(querySnapshot.empty ? [] : querySnapshot.docs[0].data().messages || []);
    } catch (error) {
      console.error("Error loading messages:", error);
      setError("Error loading messages. Please check your Firestore rules.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setAuthModalOpen(false);
      console.log("⚡ Initiating Google sign-in...");
      const user = await signInWithGoogle();
      if (user) {
        toast({ title: "Sign-in successful", status: "success", duration: 3000, isClosable: true });
        navigate("/chat");
      }
    } catch (error) {
      console.error("❌ Google login error:", error);
      setError(`Google login failed: ${error.message}`);
    }
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
      <Flex className="chat-header" justify="space-between" align="center" p={3} bg="white" boxShadow="md" position="sticky" top="0" zIndex="1000">
        <Text fontSize="xl" fontWeight="bold" ml={4}>Vedyx AI Tutor</Text>
        <HStack spacing={4} mr={4}>
          {!user ? (
            <>
              <Button variant="outline" color="black" borderColor="black" onClick={() => { setAuthMode("login"); setAuthModalOpen(true); }}>Log In</Button>
              <Button colorScheme="teal" onClick={() => { setAuthMode("signup"); setAuthModalOpen(true); }}>Sign Up</Button>
            </>
          ) : (
            <>
              <Tooltip label="Resources"><IconButton icon={<FaRegFileAlt />} aria-label="Resources" variant="ghost" /></Tooltip>
              <Tooltip label="Share"><IconButton icon={<FaShareAlt />} aria-label="Share" variant="ghost" /></Tooltip>
              <Tooltip label="Profile & Settings"><Avatar size="sm" cursor="pointer" onClick={() => signOut(auth)} /></Tooltip>
            </>
          )}
        </HStack>
      </Flex>

      <Routes>
        <Route path="/" element={<Navigate to="/chat" />} />
        <Route path="/chat" element={<Chat user={user} messages={messages} setMessages={setMessages} />} />
        <Route path="/preferences" element={<PreferencesForm user={user} />} />
      </Routes>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setAuthModalOpen(false)} mode={authMode} onGoogleLogin={handleGoogleLogin} />
    </Box>
  );
}

export default function App() {
  return <Router><AppContent /></Router>;
}
