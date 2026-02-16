import React from 'react';
import { Check } from 'lucide-react';

interface StepWizardProps {
  steps: string[];
  currentStep: number;
  onStepClick: (step: number) => void;
}

export const StepWizard: React.FC<StepWizardProps> = ({ steps, currentStep, onStepClick }) => {
  return (
    <div className="w-full mb-8">
      {/* Desktop Steps */}
      <div className="hidden md:flex justify-between items-center relative px-2">
        <div className="absolute top-4 left-0 w-full h-1 bg-gray-200 -z-0 rounded-full"></div>
        <div 
            className="absolute top-4 left-0 h-1 bg-blue-600 -z-0 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
        ></div>
        
        {steps.map((label, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;

            return (
                <div key={index} className="flex flex-col items-center z-10 cursor-pointer group" onClick={() => onStepClick(index)}>
                    <div 
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black border-2 transition-all duration-200 
                        ${isCompleted ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 
                          isCurrent ? 'bg-white border-blue-600 text-blue-600 scale-110 shadow-lg' : 'bg-white border-gray-300 text-gray-400 hover:border-blue-300'}`}
                    >
                        {isCompleted ? <Check size={14} /> : index + 1}
                    </div>
                    <span className={`text-[10px] mt-2 font-bold uppercase tracking-tighter w-16 text-center ${isCurrent ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-400'}`}>
                        {label.split(' ')[0]}
                    </span>
                </div>
            );
        })}
      </div>

      {/* Mobile Steps */}
      <div className="flex md:hidden items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex flex-col">
            <span className="text-[10px] text-blue-600 uppercase font-black tracking-widest">Step {currentStep + 1} of {steps.length}</span>
            <span className="text-lg font-extrabold text-slate-800">{steps[currentStep]}</span>
        </div>
        <div className="flex space-x-1">
            {steps.map((_, i) => (
                <div key={i} className={`h-1.5 w-4 rounded-full transition-all ${i === currentStep ? 'bg-blue-600 w-8' : i < currentStep ? 'bg-blue-300' : 'bg-slate-200'}`} />
            ))}
        </div>
      </div>
    </div>
  );
};