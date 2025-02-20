import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton,
  FormControl, FormLabel, Input, Button, VStack, Text, Divider 
} from "@chakra-ui/react";

function AuthModal({ isOpen, onClose, onLogin, onSignup, onGoogleLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate(); 

  const handleSubmit = async () => {
    setError(null);
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    try {
      if (isSignup) {
        await onSignup(email, password);
        onClose(); // Close modal after signup
        navigate("/preferences");
      } else {
        await onLogin(email, password);
        onClose(); // Close modal after login
        navigate("/chat");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{isSignup ? "Sign Up" : "Login"}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            {error && <Text color="red.500">{error}</Text>}

            <FormControl>
              <FormLabel>Email</FormLabel>
              <Input 
                type="email" 
                placeholder="Enter your email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Password</FormLabel>
              <Input 
                type="password" 
                placeholder="Enter your password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
              />
            </FormControl>

            <Button colorScheme="blue" width="full" onClick={handleSubmit}>
              {isSignup ? "Sign Up" : "Login"}
            </Button>

            <Divider />

            <Button colorScheme="red" width="full" onClick={onGoogleLogin}>
              Sign in with Google
            </Button>

            <Text fontSize="sm" cursor="pointer" onClick={() => setIsSignup(!isSignup)}>
              {isSignup ? "Already have an account? Login" : "Don't have an account? Sign up FOR FREE!"}
            </Text>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

export default AuthModal;
