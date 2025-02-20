import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../services/firebase";
import { 
  Box, Button, Textarea, IconButton, Flex, Avatar, Menu, MenuButton, 
  MenuList, MenuItem, Tooltip, VStack, HStack, Text 
} from "@chakra-ui/react";
import { FaRegFileAlt, FaShareAlt, FaCog, FaQuestionCircle, FaBars, FaPlus } from "react-icons/fa";

const ChatInterface = ({ user, messages, input, setInput, sendMessage, loading, chatHistory, loadChat, startNewChat }) => {
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/"); // Redirect to login page
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <Flex height="100vh" bg="gray.100">
      {/* Left Sidebar for Chat History */}
      {sidebarVisible && (
        <Box w="18%" minW="220px" p={4} bg="white" boxShadow="md" overflowY="auto" display="flex" flexDirection="column">
          {/* Collapse Sidebar Button */}
          <IconButton 
            icon={<FaBars />} 
            aria-label="Collapse Sidebar" 
            variant="ghost" 
            alignSelf="flex-start" 
            onClick={() => setSidebarVisible(false)} 
          />
          
          {/* New Chat Button */}
          <Button leftIcon={<FaPlus />} colorScheme="teal" onClick={startNewChat} mb={4}>
            New Chat
          </Button>

          <Text fontSize="xl" fontWeight="bold" mb={4}>
            Chat History
          </Text>

          {/* Chat History List */}
          <VStack align="start" spacing={2} flex="1">
            {chatHistory.map((chat) => (
              <Button key={chat.id} variant="ghost" width="100%" justifyContent="flex-start" onClick={() => loadChat(chat.id)}>
                {chat.title}
              </Button>
            ))}
          </VStack>

          {/* Help & Settings at Bottom */}
          <VStack spacing={2} align="start" mt="auto" pb={2}>
            <Button leftIcon={<FaQuestionCircle />} variant="ghost" width="100%" justifyContent="flex-start">
              Help
            </Button>
            <Button leftIcon={<FaCog />} variant="ghost" width="100%" justifyContent="flex-start">
              Settings
            </Button>
          </VStack>
        </Box>
      )}

      {/* Centered Chat Container */}
      <Box flex="1" maxW="1200px" display="flex" flexDirection="column" p={4} bg="gray.50">
        {/* Chat Messages */}
        <Box flex="1" p={4} overflowY="auto" bg="white" boxShadow="md" borderRadius="md">
          {messages.length === 0 ? (
            <Text fontSize="lg" color="gray.500" textAlign="center" mt="20">
              What do you want to learn today, {user.displayName || "Student"}? 😊
            </Text>
          ) : (
            messages.map((msg, index) => (
              <Flex key={index} justify="flex-start" mb={4}>
                <Box
                  p={3}
                  borderRadius="md"
                  bg={msg.sender === "user" ? "blue.100" : "gray.100"}
                  maxW="75%"
                  textAlign="left"
                >
                  <Text>{msg.text}</Text>
                </Box>
              </Flex>
            ))
          )}
        </Box>

        {/* Input Area */}
        {user && (
          <Box position="sticky" bottom="0" bg="gray.50" p={3} boxShadow="md">
            <Flex align="center">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                size="lg"
                resize="none"
                flex="1"
              />
              <Button 
                colorScheme="teal" 
                onClick={sendMessage} 
                isLoading={loading} 
                loadingText="Thinking..." 
                ml={2}
              >
                Send
              </Button>
            </Flex>
          </Box>
        )}
      </Box>

      {/* Top Right Icons */}
      <Box position="absolute" top="4" right="4">
        <HStack spacing={4}>
          <Tooltip label="Reference Materials" hasArrow>
            <IconButton icon={<FaRegFileAlt />} aria-label="Open Reference" variant="ghost" />
          </Tooltip>
          <Tooltip label="Share Chat" hasArrow>
            <IconButton icon={<FaShareAlt />} aria-label="Share" variant="ghost" />
          </Tooltip>
          <Menu>
            <Tooltip label="Profile & Settings" hasArrow>
              <MenuButton as={IconButton} icon={<Avatar size="sm" />} variant="ghost" />
            </Tooltip>
            <MenuList>
              <MenuItem onClick={() => navigate("/dashboard")}>Dashboard</MenuItem>
              <MenuItem>Settings</MenuItem>
              <MenuItem onClick={handleLogout}>Log Out</MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Box>
    </Flex>
  );
};

export default ChatInterface;
