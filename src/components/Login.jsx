import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, googleProvider } from "../services/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { Box, Input, Button, Text, VStack, Divider } from "@chakra-ui/react";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // 🔹 Email Login
  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/chat"); // Redirect after login
    } catch (error) {
      setError(error.message);
    }
  };

  // 🔹 Google Login
  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      navigate("/chat"); // Redirect after login
    } catch (error) {
      setError(error.message);
    }
  };

  // 🔹 Guest Access
  const handleGuestAccess = () => {
    navigate("/chat"); // Allow guest access without authentication
  };

  return (
    <Box maxW="400px" mx="auto" mt="20" p="6" borderWidth="1px" borderRadius="md" boxShadow="md">
      <Text fontSize="2xl" fontWeight="bold" textAlign="center" mb="4">
        Welcome to Vedyx
      </Text>

      {error && (
        <Box bg="red.100" p="3" borderRadius="md" mb="4">
          {error}
          <Button size="xs" ml="2" onClick={() => setError(null)}>✕</Button>
        </Box>
      )}

      <VStack spacing="4">
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button colorScheme="blue" onClick={handleLogin} width="full">
          Login
        </Button>

        <Button
          colorScheme="green"
          onClick={handleGoogleLogin}
          width="full"
        >
          Sign in with Google
        </Button>

        <Divider />

        <Button variant="outline" onClick={handleGuestAccess} width="full">
          Continue as Guest
        </Button>

        <Text fontSize="sm">
          New here?{" "}
          <Button
            variant="link"
            colorScheme="blue"
            onClick={() => navigate("/register")}
          >
            Sign Up
          </Button>
        </Text>
      </VStack>
    </Box>
  );
}

export default Login;
