import React, { useState } from "react";
import {
  Box,
  Button,
  VStack,
  Heading,
  Text,
  Progress,
  Input,
  Select,
  SimpleGrid,
  Tag,
  TagLabel,
  TagCloseButton,
  useToast,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { db } from "../services/firebase";
import { collection, doc, setDoc } from "firebase/firestore";

const PreferencesForm = ({ user }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [profile, setProfile] = useState({
    preferredName: "",
    grade: "",
    schoolSystem: "",
    primaryLanguage: "",
    secondaryLanguages: [],
    learningStyle: "",
    subjects: [],
    interests: [],
    goals: "",
    preferredPace: "",
    communicationStyle: "",
  });

  const toast = useToast();
  const navigate = useNavigate();

  const schoolSystems = ["CBSE", "ICSE", "State Board", "IB", "IGCSE", "Other"];
  const languages = ["English", "Hindi", "Spanish", "French", "German", "Mandarin", "Other"];
  const learningStyles = [
    { id: "visual", label: "Visual Learner", description: "Learn best through diagrams and images" },
    { id: "auditory", label: "Auditory Learner", description: "Learn best through discussion" },
    { id: "reading", label: "Reading/Writing Learner", description: "Learn best through written materials" },
    { id: "kinesthetic", label: "Hands-on Learner", description: "Learn best through practical exercises" },
  ];
  const subjects = ["Math", "Physics", "Chemistry", "Biology", "History", "Literature", "Computer Science"];
  const interests = ["Sports", "Music", "Art", "Technology", "Nature", "Gaming", "Reading", "Writing"];
  const grades = Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`);

  const steps = [
    {
      title: "Personal Information",
      content: (
        <VStack spacing={4} align="stretch">
          <Box>
            <Text fontWeight="medium">Preferred Name</Text>
            <Input
              placeholder="Enter your preferred name"
              value={profile.preferredName}
              onChange={(e) => setProfile({ ...profile, preferredName: e.target.value })}
            />
          </Box>
          <Box>
            <Text fontWeight="medium">Grade</Text>
            <Select
              placeholder="Select Grade"
              value={profile.grade}
              onChange={(e) => setProfile({ ...profile, grade: e.target.value })}
            >
              {grades.map((grade) => (
                <option key={grade} value={grade}>
                  {grade}
                </option>
              ))}
            </Select>
          </Box>
          <Box>
            <Text fontWeight="medium">School System</Text>
            <Select
              placeholder="Select School System"
              value={profile.schoolSystem}
              onChange={(e) => setProfile({ ...profile, schoolSystem: e.target.value })}
            >
              {schoolSystems.map((system) => (
                <option key={system} value={system}>
                  {system}
                </option>
              ))}
            </Select>
          </Box>
          <Box>
            <Text fontWeight="medium">Primary Language</Text>
            <Select
              placeholder="Select Primary Language"
              value={profile.primaryLanguage}
              onChange={(e) => setProfile({ ...profile, primaryLanguage: e.target.value })}
            >
              {languages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </Select>
          </Box>
        </VStack>
      ),
    },
    {
      title: "Learning Style",
      content: (
        <VStack spacing={4}>
          {learningStyles.map((style) => (
            <Box
              key={style.id}
              p={4}
              borderWidth="1px"
              borderRadius="lg"
              cursor="pointer"
              bg={profile.learningStyle === style.id ? "blue.100" : "gray.50"}
              onClick={() => setProfile({ ...profile, learningStyle: style.id })}
            >
              <Text fontWeight="bold">{style.label}</Text>
              <Text fontSize="sm" color="gray.600">
                {style.description}
              </Text>
            </Box>
          ))}
        </VStack>
      ),
    },
    {
      title: "Subjects & Interests",
      content: (
        <VStack spacing={4}>
          <Box>
            <Text fontWeight="medium">Subjects</Text>
            <SimpleGrid columns={2} spacing={2}>
              {subjects.map((subject) => (
                <Tag
                  key={subject}
                  size="lg"
                  variant={profile.subjects.includes(subject) ? "solid" : "outline"}
                  colorScheme={profile.subjects.includes(subject) ? "blue" : "gray"}
                  cursor="pointer"
                  onClick={() =>
                    setProfile((prev) => ({
                      ...prev,
                      subjects: prev.subjects.includes(subject)
                        ? prev.subjects.filter((s) => s !== subject)
                        : [...prev.subjects, subject],
                    }))
                  }
                >
                  <TagLabel>{subject}</TagLabel>
                  {profile.subjects.includes(subject) && <TagCloseButton />}
                </Tag>
              ))}
            </SimpleGrid>
          </Box>
          <Box>
            <Text fontWeight="medium">Interests</Text>
            <SimpleGrid columns={2} spacing={2}>
              {interests.map((interest) => (
                <Tag
                  key={interest}
                  size="lg"
                  variant={profile.interests.includes(interest) ? "solid" : "outline"}
                  colorScheme={profile.interests.includes(interest) ? "blue" : "gray"}
                  cursor="pointer"
                  onClick={() =>
                    setProfile((prev) => ({
                      ...prev,
                      interests: prev.interests.includes(interest)
                        ? prev.interests.filter((i) => i !== interest)
                        : [...prev.interests, interest],
                    }))
                  }
                >
                  <TagLabel>{interest}</TagLabel>
                  {profile.interests.includes(interest) && <TagCloseButton />}
                </Tag>
              ))}
            </SimpleGrid>
          </Box>
        </VStack>
      ),
    },
  ];

  const handleSubmit = async () => {
    if (!user?.uid) return;

    try {
      const userRef = doc(collection(db, "users"), user.uid);
      await setDoc(userRef, { ...profile, userId: user.uid });

      toast({ title: "Profile Saved", status: "success", duration: 3000 });
      navigate("/chat");
    } catch (error) {
      console.error("❌ Error saving profile:", error.message);
    }
  };

  return (
    <Box maxW="lg" mx="auto" p={6} borderWidth="1px" borderRadius="lg">
      <Heading size="lg" mb={4}>
        Customize Your Learning Experience
      </Heading>
      <Progress value={(currentStep + 1) * (100 / steps.length)} mb={4} />
      <Heading size="md" mb={2}>
        {steps[currentStep].title}
      </Heading>
      {steps[currentStep].content}
      <Box mt={6} display="flex" justifyContent="space-between">
        <Button onClick={() => setCurrentStep((prev) => prev - 1)} isDisabled={currentStep === 0}>
          Previous
        </Button>
        <Button colorScheme="blue" onClick={currentStep === steps.length - 1 ? handleSubmit : () => setCurrentStep((prev) => prev + 1)}>
          {currentStep === steps.length - 1 ? "Complete" : "Next"}
        </Button>
      </Box>
    </Box>
  );
};

export default PreferencesForm;
