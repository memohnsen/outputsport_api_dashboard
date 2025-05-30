"use client";

import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon, BookOpenIcon } from '@heroicons/react/24/outline';

interface FormulaItem {
  term: string;
  symbol: string;
  formula: string;
  description: string;
  unit: string;
  example?: string;
}

const physicsFormulas: FormulaItem[] = [
  {
    term: "Force",
    symbol: "F",
    formula: "F = m × a",
    description: "The product of mass and acceleration. In sports, this represents the amount of force an athlete generates.",
    unit: "Newtons (N)",
    example: "A 70kg athlete accelerating at 5 m/s² generates 350N of force"
  },
  {
    term: "Velocity",
    symbol: "v",
    formula: "v = d / t",
    description: "The rate of change of position. In training, this measures how fast an athlete moves a weight or their body.",
    unit: "meters per second (m/s)",
    example: "Moving a barbell 0.8m in 0.4s = 2 m/s velocity"
  },
  {
    term: "Acceleration",
    symbol: "a",
    formula: "a = Δv / Δt",
    description: "The rate of change of velocity. Higher acceleration indicates more explosive movement.",
    unit: "meters per second² (m/s²)",
    example: "Going from 0 to 2 m/s in 0.5s = 4 m/s² acceleration"
  },
  {
    term: "Power",
    symbol: "P",
    formula: "P = F × v or P = W / t",
    description: "The rate of doing work or applying force at velocity. Key indicator of athletic performance.",
    unit: "Watts (W)",
    example: "350N force at 2 m/s = 700W of power"
  },
  {
    term: "Impulse",
    symbol: "J",
    formula: "J = F × Δt",
    description: "The change in momentum, calculated as force applied over time. Important for explosive movements.",
    unit: "Newton-seconds (N·s)",
    example: "350N force applied for 0.3s = 105 N·s impulse"
  },
  {
    term: "Work",
    symbol: "W",
    formula: "W = F × d",
    description: "Energy transferred when force is applied over a distance. Total energy output in an exercise.",
    unit: "Joules (J)",
    example: "350N force over 0.8m distance = 280J of work"
  },
];

export default function PhysicsFormulasHelper() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedFormula, setSelectedFormula] = useState<FormulaItem | null>(null);

  return (
    <div className="rounded-xl bg-[#1a1a1a] p-6 backdrop-blur-sm border border-[#8C8C8C]/10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <BookOpenIcon className="h-5 w-5 text-[#887D2B]" />
          <h3 className="text-lg font-semibold text-white">Physics Formulas Reference</h3>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-1 text-[#8C8C8C] hover:text-white transition-colors"
        >
          <span className="text-sm">{isExpanded ? 'Hide' : 'Show'} Formulas</span>
          {isExpanded ? (
            <ChevronUpIcon className="h-4 w-4" />
          ) : (
            <ChevronDownIcon className="h-4 w-4" />
          )}
        </button>
      </div>

      {!isExpanded && (
        <p className="text-[#8C8C8C] text-sm">
          Quick reference for the physics formulas behind your performance metrics. Click "Show Formulas" to explore.
        </p>
      )}

      {isExpanded && (
        <div className="space-y-4">
          <p className="text-[#8C8C8C] text-sm mb-4">
            Understanding the physics behind your performance metrics helps you optimize training and track progress effectively.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {physicsFormulas.map((formula, index) => (
              <button
                key={index}
                onClick={() => setSelectedFormula(selectedFormula?.term === formula.term ? null : formula)}
                className={`text-left p-3 rounded-lg border transition-all duration-200 ${
                  selectedFormula?.term === formula.term
                    ? 'border-[#887D2B] bg-[#887D2B]/10'
                    : 'border-[#8C8C8C]/20 hover:border-[#8C8C8C]/40 hover:bg-[#8C8C8C]/5'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-white">{formula.term}</span>
                  <span className="text-[#887D2B] font-mono text-sm">{formula.symbol}</span>
                </div>
                <div className="font-mono text-sm text-[#8C8C8C] mb-1">
                  {formula.formula}
                </div>
                <div className="text-xs text-[#8C8C8C]">
                  {formula.unit}
                </div>
                <div className="text-xs text-[#8C8C8C]">
                  {formula.description}
                </div>
              </button>
            ))}
          </div>

          {selectedFormula && (
            <div className="mt-6 p-4 rounded-lg bg-[#0D0D0D] border border-[#887D2B]/30">
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-xl font-bold text-white">{selectedFormula.term}</span>
                <span className="text-[#887D2B] font-mono text-lg">({selectedFormula.symbol})</span>
              </div>
              
              <div className="mb-3">
                <span className="text-sm text-[#8C8C8C] block mb-1">Formula:</span>
                <span className="font-mono text-lg text-white bg-[#1a1a1a] px-3 py-1 rounded border border-[#8C8C8C]/20">
                  {selectedFormula.formula}
                </span>
              </div>

              <div className="mb-3">
                <span className="text-sm text-[#8C8C8C] block mb-1">Unit:</span>
                <span className="text-white">{selectedFormula.unit}</span>
              </div>

              <div className="mb-3">
                <span className="text-sm text-[#8C8C8C] block mb-1">Description:</span>
                <p className="text-white text-sm leading-relaxed">{selectedFormula.description}</p>
              </div>

              {selectedFormula.example && (
                <div>
                  <span className="text-sm text-[#8C8C8C] block mb-1">Example:</span>
                  <p className="text-[#887D2B] text-sm italic">{selectedFormula.example}</p>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 p-4 rounded-lg bg-[#0D0D0D] border border-[#8C8C8C]/20">
            <h4 className="text-white font-medium mb-2 flex items-center">
              <span className="w-2 h-2 bg-[#887D2B] rounded-full mr-2"></span>
              Key Relationships in Sports Performance
            </h4>
            <div className="space-y-2 text-sm text-[#8C8C8C]">
              <p><strong className="text-white">Force-Velocity:</strong> Higher velocity typically means lower force output (inverse relationship)</p>
              <p><strong className="text-white">Power Optimization:</strong> Peak power occurs at moderate force and velocity combinations</p>
              <p><strong className="text-white">Rate of Force Development:</strong> How quickly you can generate force (acceleration phase)</p>
              <p><strong className="text-white">Impulse-Momentum:</strong> Greater impulse leads to greater change in momentum</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 