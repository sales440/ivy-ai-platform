/**
 * Onboarding Tour Component
 * Simple guided tour for new users
 */

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, X } from "lucide-react";
import { useLocation } from "wouter";

interface TourStep {
  title: string;
  description: string;
  action?: {
    label: string;
    path: string;
  };
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "Welcome to Ivy.AI Platform! 🎉",
    description: "Let's take a quick tour to help you get started with our intelligent agent orchestration system.",
  },
  {
    title: "Dashboard Overview 📊",
    description: "Your dashboard shows real-time metrics for leads, tickets, and agent activity. This is your command center.",
    action: {
      label: "Go to Dashboard",
      path: "/dashboard",
    },
  },
  {
    title: "Manage Leads 👥",
    description: "Create, qualify, and convert leads using our ML-powered scoring system. Import leads from CSV or create them manually.",
    action: {
      label: "View Leads",
      path: "/leads",
    },
  },
  {
    title: "ML Scoring Dashboard 🎯",
    description: "Our machine learning system scores leads based on EPM historical data (26.7%, 44.4%, 46.9% conversion rates by sector).",
    action: {
      label: "View ML Scoring",
      path: "/analytics/ml-scoring",
    },
  },
  {
    title: "ROI Projections 💰",
    description: "See revenue projections by sector (Educativo, Hotelero, Residencial) based on your active pipeline.",
    action: {
      label: "View ROI Dashboard",
      path: "/analytics/roi",
    },
  },
  {
    title: "Email Automation ✉️",
    description: "Set up automated email sequences (0-3-7-14 days) for each sector. Track opens, clicks, and responses in real-time.",
    action: {
      label: "View Email Templates",
      path: "/email-templates",
    },
  },
  {
    title: "Quick Navigation ⌨️",
    description: "Press Cmd+K (or Ctrl+K) anytime to open the global search. Quickly navigate to any page or find leads/tickets.",
  },
  {
    title: "You're All Set! 🚀",
    description: "You're ready to start using Ivy.AI. Need help? Check the documentation or contact support.",
  },
];

export function OnboardingTour() {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [, setLocation] = useLocation();

  // Check if user has completed onboarding
  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem('onboarding_completed');
    if (!hasCompletedOnboarding) {
      // Show onboarding after a short delay
      const timer = setTimeout(() => {
        setOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('onboarding_completed', 'true');
    setOpen(false);
    setCurrentStep(0);
  };

  const handleSkip = () => {
    localStorage.setItem('onboarding_completed', 'true');
    setOpen(false);
    setCurrentStep(0);
  };

  const handleAction = (path: string) => {
    setLocation(path);
    handleNext();
  };

  const step = TOUR_STEPS[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === TOUR_STEPS.length - 1;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <button
          onClick={handleSkip}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Skip tour</span>
        </button>

        <DialogHeader>
          <DialogTitle>{step.title}</DialogTitle>
          <DialogDescription>{step.description}</DialogDescription>
        </DialogHeader>

        {step.action && (
          <div className="py-4">
            <Button
              onClick={() => handleAction(step.action!.path)}
              className="w-full"
              variant="outline"
            >
              {step.action.label}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <div className="flex gap-1">
            {TOUR_STEPS.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 w-1.5 rounded-full transition-colors ${
                  index === currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            {!isFirstStep && (
              <Button
                onClick={handlePrevious}
                variant="outline"
                size="sm"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
            <Button
              onClick={handleNext}
              size="sm"
            >
              {isLastStep ? 'Get Started' : 'Next'}
              {!isLastStep && <ChevronRight className="h-4 w-4 ml-1" />}
            </Button>
          </div>
        </DialogFooter>

        <div className="text-xs text-center text-muted-foreground">
          Step {currentStep + 1} of {TOUR_STEPS.length}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Restart tour function (can be called from settings or help menu)
 */
export function restartOnboardingTour() {
  localStorage.removeItem('onboarding_completed');
  window.location.reload();
}
