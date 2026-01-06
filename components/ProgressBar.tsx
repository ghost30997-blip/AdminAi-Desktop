
import React from 'react';
import { Check } from 'lucide-react';
import { AppStep } from '../types';

interface ProgressBarProps {
  currentStep: AppStep;
}

const steps = [
  { id: AppStep.UPLOAD_DATA, label: 'Base de Dados' },
  { id: AppStep.CONFIRM_DATA, label: 'Análise' },
  { id: AppStep.UPLOAD_TEMPLATE, label: 'Template' },
  { id: AppStep.EDITOR, label: 'Mapeamento' },
  { id: AppStep.GENERATE, label: 'Processamento' },
];

export const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep }) => {
  return (
    <div className="w-full bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 py-4 px-4 md:px-6 shadow-sm z-40 overflow-x-auto custom-scrollbar">
      <div className="max-w-5xl mx-auto min-w-[600px]">
        <div className="relative flex justify-between items-center">
          
          {/* Background Line */}
          <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 dark:bg-slate-700 rounded-full -z-10 transform -translate-y-1/2" />
          
          {/* Active Connector Line */}
          <div 
            className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-brand-orange to-brand-blue rounded-full -z-10 transform -translate-y-1/2 transition-all duration-500 ease-in-out"
            style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
          />

          {steps.map((step, index) => {
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;

            return (
              <div key={step.id} className="flex flex-col items-center group cursor-default">
                <div 
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 border-2
                    ${isCompleted 
                        ? 'bg-brand-blue border-brand-blue text-white' 
                        : ''}
                    ${isCurrent 
                        ? 'bg-white dark:bg-slate-800 border-brand-orange text-brand-orange scale-110 shadow-md' 
                        : ''}
                    ${!isCompleted && !isCurrent 
                        ? 'bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-300 dark:text-slate-500' 
                        : ''}
                  `}
                >
                  {isCompleted ? <Check size={14} /> : index + 1}
                </div>
                
                <span className={`mt-2 text-xs font-semibold tracking-wide transition-colors ${isCurrent ? 'text-brand-dark dark:text-white' : 'text-gray-400 dark:text-slate-500'}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
