import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../services/firebase";
import {
  Box, Button, Textarea, IconButton, Flex, Avatar, Menu, MenuButton,
  MenuList, MenuItem, Tooltip, VStack, HStack, Text, Divider, useColorModeValue
} from "@chakra-ui/react";
import { FaRegFileAlt, FaShareAlt, FaCog, FaQuestionCircle, FaBars, FaPlus, FaChevronLeft, FaChevronRight } from "react-icons/fa";

const ChatInterface = ({ user, messages, input, setInput, sendMessage, loading, chatHistory, loadChat, startNewChat }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < 768); // Start collapsed on mobile
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/"); // Redirect to login page
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle screen resize
  useEffect(() => {
    const handleResize = () => {
      setSidebarCollapsed(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const bgColor = useColorModeValue("gray.50", "gray.900");
  const sidebarBg = useColorModeValue("white", "gray.800");

  return (
    <Flex height="100vh" bg={bgColor} flexDirection={{ base: "column", md: "row" }}>

      {/* Sidebar with Collapsible Feature */}
      <Box
        w={sidebarCollapsed ? "60px" : "250px"}
        minW={sidebarCollapsed ? "60px" : "250px"}
        transition="width 0.3s"
        bg={sidebarBg}
        boxShadow="md"
        p={sidebarCollapsed ? 2 : 4}
        overflowY="auto"
        display="flex"
        flexDirection="column"
      >
        {/* Sidebar Toggle Button */}
        <IconButton
          icon={sidebarCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
          aria-label="Toggle Sidebar"
          variant="ghost"
          alignSelf="flex-start"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          mb={3}
        />

        {!sidebarCollapsed && (
          <>
            {/* New Chat Button */}
            <Button leftIcon={<FaPlus />} colorScheme="teal" onClick={startNewChat} mb={4}>
              New Chat
            </Button>

            {/* Chat History */}
            <Text fontSize="lg" fontWeight="bold" mb={3}>
              Chat History
            </Text>

            <VStack align="start" spacing={2} flex="1">
              {chatHistory.map((chat) => (
                <Button key={chat.id} variant="ghost" width="100%" justifyContent="flex-start" onClick={() => loadChat(chat.id)}>
                  {chat.title}
                </Button>
              ))}
            </VStack>

            <Divider my={4} />

            {/* Bottom Sidebar Links */}
            <VStack spacing={2} align="start" mt="auto" pb={2}>
              <Button leftIcon={<FaQuestionCircle />} variant="ghost" width="100%" justifyContent="flex-start">
                Help
              </Button>
              <Button leftIcon={<FaCog />} variant="ghost" width="100%" justifyContent="flex-start" onClick={() => navigate("/settings")}>
                Settings
              </Button>
            </VStack>
          </>
        )}
      </Box>

      {/* Main Chat Area */}
      <Box flex="1" maxW="900px" display="flex" flexDirection="column" p={4} mx="auto" width="100%">
        {/* Chat Messages */}
        <Box flex="1" p={4} overflowY="auto" bg="white" boxShadow="md" borderRadius="md">
          {messages.length === 0 ? (
            <Text fontSize="lg" color="gray.500" textAlign="center" mt="20">
              What do you want to learn today, {user?.displayName || "Student"}? 😊
            </Text>
          ) : (
            messages.map((msg, index) => (
              <Flex key={index} justify={msg.sender === "user" ? "flex-end" : "flex-start"} mb={4}>
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
          <div ref={messagesEndRef} />
        </Box>

        {/* Input Area */}
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
              onClick={() => {
                if (!input.trim()) return;
                sendMessage();
              }}
              isLoading={loading}
              loadingText="Thinking..."
              ml={2}
            >
              Send
            </Button>
          </Flex>
        </Box>
      </Box>

      {/* Top Right Profile & Actions */}
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
