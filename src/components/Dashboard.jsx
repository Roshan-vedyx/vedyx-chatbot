import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";
import { Box, Button, Input, Select, VStack, Text, Heading } from "@chakra-ui/react";

const Dashboard = () => {
  const [preferences, setPreferences] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [updatedPreferences, setUpdatedPreferences] = useState({});

  useEffect(() => {
    const fetchPreferences = async () => {
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
          setPreferences(docSnap.data());
          setUpdatedPreferences(docSnap.data());
        }
      }
    };
    fetchPreferences();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUpdatedPreferences({ ...updatedPreferences, [name]: value });
  };

  const savePreferences = async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, updatedPreferences);
        setPreferences(updatedPreferences);
        setIsEditing(false);
      } catch (error) {
        console.error("Error updating preferences:", error);
      }
    }
  };

  if (!preferences) return <Text>Loading...</Text>;

  return (
    <Box p={6} maxW="600px" mx="auto">
      <Heading mb={4}>Your Dashboard</Heading>
      <VStack spacing={4} align="start">
        <Text fontWeight="bold">Name:</Text>
        {isEditing ? (
          <Input name="name" value={updatedPreferences.name} onChange={handleChange} />
        ) : (
          <Text>{preferences.name}</Text>
        )}

        <Text fontWeight="bold">Class Level:</Text>
        {isEditing ? (
          <Select name="class" value={updatedPreferences.class} onChange={handleChange}>
            <option value="">Select Class</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </Select>
        ) : (
          <Text>{preferences.class}</Text>
        )}

        <Text fontWeight="bold">Favorite Subjects:</Text>
        {isEditing ? (
          <Input name="subjects" value={updatedPreferences.subjects} onChange={handleChange} />
        ) : (
          <Text>{preferences.subjects}</Text>
        )}

        <Text fontWeight="bold">Interests & Hobbies:</Text>
        {isEditing ? (
          <Input name="interests" value={updatedPreferences.interests} onChange={handleChange} />
        ) : (
          <Text>{preferences.interests}</Text>
        )}
      </VStack>

      <Button mt={4} colorScheme="blue" onClick={() => setIsEditing(!isEditing)}>
        {isEditing ? "Cancel" : "Edit Preferences"}
      </Button>
      {isEditing && (
        <Button mt={4} ml={2} colorScheme="teal" onClick={savePreferences}>
          Save Changes
        </Button>
      )}
    </Box>
  );
};

export default Dashboard;
