import React from "react";
import ReactDOM from "react-dom/client";
import { ChakraProvider } from "@chakra-ui/react";
import { ClerkProvider } from "@clerk/clerk-react"; // Import Clerk
import App from "./App.jsx";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY; // Load Clerk API key from .env

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ClerkProvider
      publishableKey={clerkPubKey}
      appearance={{
        variables: {
          colorPrimary: "#008080", // Main Vedyx teal color
          colorText: "#333333", // Text color
          fontFamily: "Inter, sans-serif", // Global font
        },
        elements: {
          rootBox: "shadow-md border border-gray-300 rounded-lg bg-white p-4", // Box styling
          headerTitle: "text-2xl font-bold text-teal-600", // Title styling
          formButtonPrimary: "bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded", // Primary button styling
          socialButtonsBlockButton: "bg-gray-100 hover:bg-gray-200 text-gray-700", // Google login button
        },
      }}
    >
      <ChakraProvider>
        <App />
      </ChakraProvider>
    </ClerkProvider>
  </React.StrictMode>
);
