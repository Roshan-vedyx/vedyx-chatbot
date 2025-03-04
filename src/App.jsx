import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { useUser, SignInButton, SignUpButton, SignOutButton } from "@clerk/clerk-react"; // Clerk imports
import AuthModal from "./components/AuthModal";
import Chat from "./components/Chat";
import PreferencesForm from "./components/PreferencesForm";
import { Box, Spinner, Text, Button, Flex, IconButton, Avatar, Tooltip, HStack, useToast } from "@chakra-ui/react";
import { FaRegFileAlt, FaShareAlt } from "react-icons/fa";

function AppContent() {
  const { isSignedIn, user } = useUser(); // Get user info from Clerk
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    if (user) {
      console.log("👤 Clerk Authenticated User:", user);
      loadPreviousMessages(user.id);
      setIsLoading(false);
    } else {
      console.warn("⚠️ No User Logged In");
      setIsLoading(false);
    }
  }, [user]);

  const loadPreviousMessages = async (userId) => {
    try {
      setIsLoading(true);
      // Fetch messages from Firestore or your database (replace with your implementation)
      // Example:
      // const messages = await fetchMessagesFromDatabase(userId);
      // setMessages(messages);
    } catch (error) {
      console.error("Error loading messages:", error);
      setError("Error loading messages. Please check your Firestore rules.");
    } finally {
      setIsLoading(false);
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
          {!isSignedIn ? (
            <>
              <SignInButton mode="modal">
                <Button variant="outline" color="black" borderColor="black">Log In</Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button colorScheme="teal">Sign Up</Button>
              </SignUpButton>
            </>
          ) : (
            <>
              <Tooltip label="Resources"><IconButton icon={<FaRegFileAlt />} aria-label="Resources" variant="ghost" /></Tooltip>
              <Tooltip label="Share"><IconButton icon={<FaShareAlt />} aria-label="Share" variant="ghost" /></Tooltip>
              <Tooltip label="Profile & Settings">
              <Avatar size="sm" src={user.imageUrl} cursor="pointer" crossOrigin="anonymous" />
              </Tooltip>
              <SignOutButton>
                <Button size="sm" variant="ghost">Log Out</Button>
              </SignOutButton>
            </>
          )}
        </HStack>
      </Flex>

      <Routes>
        <Route path="/" element={<Navigate to="/chat" />} />
        <Route path="/chat" element={<Chat user={user} messages={messages} setMessages={setMessages} />} />
        <Route path="/preferences" element={<PreferencesForm user={user} />} />
      </Routes>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setAuthModalOpen(false)} mode={authMode} />
    </Box>
  );
}

export default function App() {
  return <Router><AppContent /></Router>;
}
