// src/components/Hr/Onboard.jsx remains unchanged

// New file: src/components/Onboarding/OnboardingChecklist.jsx

import React from 'react';
import OnboardingChecklist from '../Onboarding/OnboardingChecklist';
import DocumentUploader from '../Onboarding/DocumentUploader';
import WelcomeTasks from '../Onboarding/WelcomeTasks';

const Onboard = () => {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">New Hire Onboarding</h1>
      <div className="space-y-6">
        <OnboardingChecklist />
        <DocumentUploader />
        <WelcomeTasks />
      </div>
    </div>
  );
};

export default Onboard;

