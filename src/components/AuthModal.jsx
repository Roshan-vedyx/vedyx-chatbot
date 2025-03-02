import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Modal, 
  ModalOverlay, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalCloseButton,
  FormControl, 
  FormLabel, 
  Input, 
  Button, 
  VStack, 
  Text, 
  Divider,
  useToast,
  Box
} from "@chakra-ui/react";
import { FcGoogle } from "react-icons/fc";
import { renderGoogleSignInButton, signInWithGoogle } from "../services/firebase";

function AuthModal({ isOpen, onClose, onLogin, onSignup, mode = "login" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(mode === "signup");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const googleButtonRef = useRef(null);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    setIsSignup(mode === "signup");
  }, [mode, isOpen]);

  useEffect(() => {
    if (isOpen && googleButtonRef.current) {
      renderGoogleSignInButton("google-signin-button", {
        theme: "filled_blue",
        size: "large",
        text: "signin_with"
      });
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    setError(null);
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    setIsLoading(true);
    try {
      if (isSignup) {
        await onSignup(email, password);
        toast({ title: "Account created.", status: "success", duration: 5000, isClosable: true });
        onClose();
        navigate("/preferences");
      } else {
        await onLogin(email, password);
        toast({ title: "Login successful.", status: "success", duration: 3000, isClosable: true });
        onClose();
        navigate("/chat");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualGoogleLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const user = await signInWithGoogle();
      if (user) {
        toast({ title: "Google login successful.", status: "success", duration: 3000, isClosable: true });
        onClose();
        navigate("/chat");
      }
    } catch (err) {
      setError(err.message || "Google login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{isSignup ? "Sign Up For FREE!" : "Login"}</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={4}>
            {error && <Text color="red.500" fontSize="sm" textAlign="center">{error}</Text>}
            <FormControl>
              <FormLabel>Email</FormLabel>
              <Input type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </FormControl>
            <FormControl>
              <FormLabel>Password</FormLabel>
              <Input type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </FormControl>
            <Button colorScheme="teal" width="full" onClick={handleSubmit} isLoading={isLoading}>
              {isSignup ? "Sign Up For FREE!" : "Login"}
            </Button>
            <Divider />
            <Box id="google-signin-button" ref={googleButtonRef} width="full" height="42px" display="flex" justifyContent="center" />
            <Button leftIcon={<FcGoogle />} colorScheme="blue" variant="outline" width="full" onClick={handleManualGoogleLogin} isLoading={isLoading}>
              Sign in with Google
            </Button>
            <Text fontSize="sm" cursor="pointer" color="blue.500" textAlign="center" onClick={() => setIsSignup(!isSignup)}>
              {isSignup ? "Already have an account? Log in" : "Don't have an account? Sign up for FREE!"}
            </Text>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

export default AuthModal;
