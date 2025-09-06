import React from 'react';
import { Check, Circle, ArrowRight } from 'lucide-react';
import { ProcessingStep } from '../types';

interface ProcessingStepsProps {
  steps: ProcessingStep[];
  currentStep: string;
}

const ProcessingSteps: React.FC<ProcessingStepsProps> = ({ steps, currentStep }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Progresso do Processamento</h3>
      
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className={`flex flex-col items-center min-w-32 ${
              step.completed ? 'text-green-600' : 
              step.active ? 'text-blue-600' : 'text-gray-400'
            }`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors duration-200 ${
                step.completed ? 'bg-green-100' : 
                step.active ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                {step.completed ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Circle className="w-5 h-5" />
                )}
              </div>
              <span className="text-sm text-center font-medium">{step.name}</span>
              {step.active && (
                <div className="mt-2 w-16 h-1 bg-blue-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full animate-pulse"></div>
                </div>
              )}
            </div>
            
            {index < steps.length - 1 && (
              <ArrowRight className={`w-4 h-4 ${
                steps[index + 1].completed || steps[index + 1].active ? 'text-blue-400' : 'text-gray-300'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default ProcessingSteps;