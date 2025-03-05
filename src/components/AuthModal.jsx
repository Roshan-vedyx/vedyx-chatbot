import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, VStack, Text, Divider, Box } from "@chakra-ui/react";
import { SignIn, SignUp, useUser } from "@clerk/clerk-react";
import { setDoc, doc, getDoc } from "firebase/firestore";
import { db } from "../services/firebase";

function AuthModal({ isOpen, onClose, mode = "login" }) {
  const [isSignup, setIsSignup] = useState(mode === "signup");
  const { user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    setIsSignup(mode === "signup");
  }, [mode, isOpen]);

  useEffect(() => {
    if (user) {
      createUserInFirestore(user);
      navigate("/chat"); // Ensure redirect happens correctly
    }
  }, [user, navigate]);

  const createUserInFirestore = async (user) => {
    if (!user || !user.primaryEmailAddress) {
      console.error("❌ No user or email found in Clerk user object:", user);
      return;
    }

    const userEmail = user.primaryEmailAddress.emailAddress; // Extract email as string
    console.log("✅ Attempting to create user in Firestore:", userEmail);

    const userRef = doc(db, "users", userEmail); // Now it's a valid string path
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      console.log("🆕 Creating new user in Firestore...");
      await setDoc(userRef, {
        email: userEmail,
        created_at: new Date(),
        preferences: {},
        chat_history: []
      });
      console.log("✅ User successfully created in Firestore!");
    } else {
      console.log("ℹ️ User already exists in Firestore.");
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
            <Box width="full" display="flex" justifyContent="center">
              {isSignup ? <SignUp afterSignUpUrl="/chat" /> : <SignIn afterSignInUrl="/chat" />}
            </Box>
            <Divider />
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
