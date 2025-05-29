"use client";

import { useState } from 'react';
import type { Athlete } from '@/services/outputSports.client';
import { AI_MODELS, MODEL_CONFIGS, DEFAULT_ANALYSIS_MODEL, type AIModel } from '@/lib/ai-client';

interface AIAnalysisProps {
  selectedAthlete: Athlete | null;
  timeRange: string;
  selectedExercise: string | null;
}

interface AnalysisResponse {
  analysis: string;
  athleteName: string;
  timeRange: string;
  dataPoints: number;
  model?: string;
  modelDescription?: string;
}

export default function AIAnalysis({ selectedAthlete, timeRange, selectedExercise }: AIAnalysisProps) {
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<AIModel>(DEFAULT_ANALYSIS_MODEL);

  const generateAnalysis = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          athleteId: selectedAthlete?.id || null,
          timeRange: timeRange,
          exerciseId: selectedExercise,
          model: selectedModel,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate analysis');
      }

      const data: AnalysisResponse = await response.json();
      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const resetAnalysis = () => {
    setAnalysis(null);
    setError(null);
  };

  // Get model display name from configuration or fallback to auto-generated
  const getModelDisplayName = (modelId: string) => {
    const config = MODEL_CONFIGS[modelId as AIModel];
    if (config?.displayName) {
      return config.displayName;
    }
    
    // Fallback to auto-generated name if displayName not set
    const modelKey = Object.keys(AI_MODELS).find(key => AI_MODELS[key as keyof typeof AI_MODELS] === modelId);
    if (modelKey) {
      return modelKey.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ');
    }
    return modelId;
  };

  // Group models by provider
  const getModelsByProvider = () => {
    const grouped: Record<string, Array<{key: string, value: string, description: string, displayName: string}>> = {};
    
    Object.entries(AI_MODELS).forEach(([key, value]) => {
      const config = MODEL_CONFIGS[value as AIModel];
      const provider = config?.provider || 'Unknown';
      
      if (!grouped[provider]) {
        grouped[provider] = [];
      }
      
      grouped[provider].push({
        key,
        value,
        description: config?.description || '',
        displayName: config?.displayName || getModelDisplayName(value)
      });
    });
    
    return grouped;
  };

  const modelsByProvider = getModelsByProvider();

  const formatAnalysis = (text: string) => {
    // Split by lines and format with basic markdown-like styling
    const lines = text.split('\n');
    return lines.map((line, index) => {
      // Check if line is a heading (starts with number followed by period)
      if (line.match(/^\d+\.\s/)) {
        return (
          <h4 key={index} className="text-lg font-semibold text-[#887D2B] mt-4 mb-2">
            {line}
          </h4>
        );
      }
      // Check if line is a section heading (starts with ##)
      if (line.startsWith('## ')) {
        return (
          <h3 key={index} className="text-xl font-bold text-white mt-6 mb-3">
            {line.replace('## ', '')}
          </h3>
        );
      }
      // Check if line is a subsection heading (starts with ###)
      if (line.startsWith('### ')) {
        return (
          <h4 key={index} className="text-lg font-semibold text-[#887D2B] mt-4 mb-2">
            {line.replace('### ', '')}
          </h4>
        );
      }
      // Check if line starts with bullet point
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <li key={index} className="text-white ml-4 mb-1">
            {line.substring(2)}
          </li>
        );
      }
      // Regular paragraph
      if (line.trim()) {
        return (
          <p key={index} className="text-white mb-2">
            {line}
          </p>
        );
      }
      // Empty line
      return <div key={index} className="mb-2" />;
    });
  };

  return (
    <div className="w-full rounded-xl bg-[#1a1a1a] p-4 sm:p-6 backdrop-blur-sm border border-[#8C8C8C]/10">
      <div className="mb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg sm:text-xl font-semibold text-white">
            🤖 AI Performance Analysis
          </h3>
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-2 sm:items-center">
            {analysis && (
              <button
                onClick={resetAnalysis}
                disabled={loading}
                className="w-full sm:w-auto px-3 py-3 sm:py-2 rounded-md font-medium transition-colors bg-[#8C8C8C]/20 text-[#8C8C8C] hover:bg-[#8C8C8C]/30 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-sm"
              >
                Reset
              </button>
            )}
            <div className="w-full sm:w-auto">
              <label className="mb-1 block text-sm font-medium text-[#8C8C8C] sm:hidden">
                AI Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value as AIModel)}
                disabled={loading}
                className="w-full sm:w-auto px-3 py-3 sm:py-2 rounded-md border border-[#8C8C8C]/20 bg-[#0D0D0D] text-white focus:border-[#887D2B] focus:ring focus:ring-[#887D2B]/30 disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-sm"
                title={MODEL_CONFIGS[selectedModel as AIModel]?.description}
              >
                {Object.entries(modelsByProvider).map(([provider, models]) => (
                  <optgroup key={provider} label={`${provider} Models`}>
                    {models.map(({ key, value, description, displayName }) => (
                      <option key={key} value={value} title={description}>
                        {displayName}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <button
              onClick={generateAnalysis}
              disabled={loading}
              className={`w-full sm:w-auto px-4 py-3 sm:py-2 rounded-md font-medium transition-colors text-base sm:text-sm ${
                loading
                  ? 'bg-[#8C8C8C]/30 text-[#8C8C8C] cursor-not-allowed'
                  : 'bg-[#887D2B] text-white hover:bg-[#776c25] active:bg-[#665b20]'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-t-2 border-white mr-2"></div>
                  Analyzing...
                </div>
              ) : (
                analysis ? 'Regenerate Analysis' : 'Generate AI Analysis'
              )}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-500/20 border border-red-500/30 p-4 mb-4">
          <p className="text-red-300">Error: {error}</p>
          <button
            onClick={generateAnalysis}
            className="mt-2 text-sm text-red-200 hover:text-red-100 underline"
          >
            Try again
          </button>
        </div>
      )}

      {analysis ? (
        <div className="bg-[#0D0D0D]/50 rounded-lg p-4 sm:p-6 border border-[#8C8C8C]/10">
          <div className="mb-4 pb-3 border-b border-[#8C8C8C]/20">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h4 className="text-base sm:text-lg font-medium text-white">
                Analysis for: <span className="text-[#887D2B]">{analysis.athleteName}</span>
              </h4>
              <div className="flex flex-wrap gap-2 sm:gap-4 text-sm text-[#8C8C8C]">
                <span>Time Range: {analysis.timeRange}</span>
                <span>Data Points: {analysis.dataPoints}</span>
                {analysis.model && (
                  <span className="break-all sm:break-normal">
                    Model: {getModelDisplayName(analysis.model)}
                    {MODEL_CONFIGS[analysis.model as AIModel]?.provider && (
                      <span className="text-[#887D2B] ml-1">
                        ({MODEL_CONFIGS[analysis.model as AIModel]?.provider})
                      </span>
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="prose prose-invert max-w-none text-sm sm:text-base">
            {formatAnalysis(analysis.analysis)}
          </div>
        </div>
      ) : (
        <div className="bg-[#0D0D0D]/30 rounded-lg p-4 sm:p-6 border border-[#8C8C8C]/10 text-center">
          <p className="text-[#8C8C8C] mb-4 text-sm sm:text-base">
            Click "Generate AI Analysis" to get insights on {selectedAthlete ? `${selectedAthlete.fullName}'s` : 'all athletes'} performance data
            for {selectedExercise ? selectedExercise : 'all exercises'} in the {timeRange} time period.
          </p>
        </div>
      )}
    </div>
  );
} 