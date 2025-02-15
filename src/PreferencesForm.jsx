import React, { useState } from 'react';
import styled from 'styled-components';

// Progress bar component
const ProgressBar = ({ currentStep, totalSteps }) => {
  const Container = styled.div`
    width: 100%;
    height: 4px;
    background-color: #eee;
    border-radius: 2px;
    margin-bottom: 2rem;
    margin-top: 1rem;
  `;

  const Progress = styled.div`
    width: ${({ currentStep, totalSteps }) => `${(currentStep + 1) / totalSteps * 100}%`};
    height: 100%;
    background-color: #2196f3;
    border-radius: 2px;
    transition: width 0.3s ease;
  `;

  return (
    <Container>
      <Progress currentStep={currentStep} totalSteps={totalSteps} />
    </Container>
  );
};

const PreferencesForm = () => {
  // ... (rest of your state and data)

  const Container = styled.div`
    width: 100%;
    max-width: 42rem;
    margin: 0 auto;
    padding: 2rem;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  `;

  const Header = styled.div`
    margin-bottom: 1.5rem;
  `;

  const Title = styled.h2`
    font-size: 1.5rem;
    font-weight: bold;
    margin-bottom: 0.5rem;
  `;

  const StepIndicator = styled.p`
    color: #666;
    margin-bottom: 1rem;
  `;

  const FormGroup = styled.div`
    margin-bottom: 1rem;
  `;

  const Label = styled.label`
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
  `;

  const Input = styled.input`
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 0.25rem;
    font-size: 1rem;
  `;

  const Select = styled.select`
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 0.25rem;
    font-size: 1rem;
  `;

  const Grid = styled.div`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  `;

  const Card = styled.div`
    padding: 1rem;
    border: 1px solid #ddd;
    border-radius: 0.25rem;
    cursor: pointer;
    transition: all 0.2s;

    ${({ selected }) => selected && `
      background-color: #e6f3ff;
      border-color: #2196f3;
    `}
  `;

  const LearningStyleCard = styled.div`
    padding: 1rem;
    border: 1px solid #ddd;
    border-radius: 0.5rem;
    cursor: pointer;
    margin-bottom: 0.5rem;
    ${({ selected }) => selected && `
      background-color: #e6f3ff;
      border-color: #2196f3;
    `}
  `;

  const ButtonContainer = styled.div`
    display: flex;
    justify-content: space-between;
    margin-top: 1.5rem;
  `;

  const Button = styled.button`
    padding: 0.5rem 1rem;
    border-radius: 0.25rem;
    border: none;
    cursor: pointer;
    font-size: 1rem;
    transition: all 0.2s;

    ${({ primary }) => primary && `
      background-color: #2196f3;
      color: white;
    `}

    ${({ outline }) => outline && `
      background-color: transparent;
      border: 1px solid #2196f3;
      color: #2196f3;
    `}

    ${({ disabled }) => disabled && `
      opacity: 0.5;
      cursor: not-allowed;
    `}
  `;

  const Confirmation = styled.div`
    text-align: center;
    padding: 2rem;
  `;

  const ConfirmationIcon = styled.div`
    color: #4CAF50;
    font-size: 3rem;
    margin-bottom: 1rem;
  `;


  // ... (rest of your component logic, handleComplete, steps, etc.)

  if (showConfirmation) {
    return (
      <Container>
        <Confirmation>
          <ConfirmationIcon>✓</ConfirmationIcon>
          <Title>Profile Created Successfully!</Title>
          <p>Redirecting you to your personalized learning experience...</p>
        </Confirmation>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>Let's Personalize Your Learning Journey</Title>
        <StepIndicator>Step {currentStep + 1} of {steps.length}</StepIndicator>
        <ProgressBar currentStep={currentStep} totalSteps={steps.length} />
      </Header>

      <div>
        <Title>{steps[currentStep].title}</Title>
        {steps[currentStep].content}

        <ButtonContainer>
          <Button
            outline
            disabled={currentStep === 0}
            onClick={() => setCurrentStep(prev => prev - 1)}
          >
            Previous
          </Button>
          <Button
            primary
            disabled={currentStep === 0 && !profile.preferredName}
            onClick={() => {
              if (currentStep === steps.length - 1) {
                handleComplete();
              } else {
                setCurrentStep(prev => prev + 1);
              }
            }}
          >
            {currentStep === steps.length - 1 ? 'Complete' : 'Next'}
          </Button>
        </ButtonContainer>
      </div>
    </Container>
  );
};

export default PreferencesForm;