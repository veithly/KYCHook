interface Step {
  id: string;
  label: string;
}

interface StepperProps {
  steps: Step[];
  activeId: string;
}

export function Stepper({ steps, activeId }: StepperProps) {
  return (
    <div className="kyc-stepper">
      {steps.map((step) => (
        <div
          key={step.id}
          className={`kyc-step ${step.id === activeId ? "active" : ""}`.trim()}
        >
          {step.label}
        </div>
      ))}
    </div>
  );
}
