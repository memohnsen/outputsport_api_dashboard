import OpenAI from 'openai';
import { env } from '@/env';

// Available models through OpenRouter and direct OpenAI
export const AI_MODELS = {
  // OpenRouter models (free)
  DEEPSEEK_R1_0528: 'deepseek/deepseek-r1-0528:free',
  DEEPSEEK_QWEN_0528: 'deepseek/deepseek-r1-0528-qwen3-8b:free',
  GEMINI_2_FLASH_EXP: 'google/gemini-2.0-flash-exp:free',
  META_LLAMA_4_MAVERICK: 'meta-llama/llama-4-maverick:free',
  META_LLAMA_4_SCOUT: 'meta-llama/llama-4-scout:free',
  
  // Direct OpenAI models
  OPEN_AI_GPT_4_1: 'gpt-4.1',
} as const;

export type AIModel = typeof AI_MODELS[keyof typeof AI_MODELS];

// Check if model is OpenAI direct (not through OpenRouter)
const isDirectOpenAIModel = (model: string): boolean => {
  return model.startsWith('gpt-');
};

// Create AI client based on model type
export const createAIClient = (model: string) => {
  if (isDirectOpenAIModel(model)) {
    // Direct OpenAI client
    return new OpenAI({
      apiKey: env.OPENAI_KEY,
      timeout: 60000,
      maxRetries: 3,
    });
  } else {
    // OpenRouter client
    return new OpenAI({
      apiKey: env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': process.env.NODE_ENV === 'production' 
          ? 'https://output-nu.vercel.app/' 
          : 'http://localhost:3000',
        'X-Title': 'Athletic Performance Analysis',
      },
      timeout: 60000,
      maxRetries: 3,
    });
  }
};

// Default model for analysis
export const DEFAULT_ANALYSIS_MODEL: AIModel = AI_MODELS.DEEPSEEK_R1_0528;

// Model configurations with specific settings for different use cases
// 
// ✨ CUSTOMIZE DISPLAY NAMES HERE ✨
// Change the 'displayName' field to control how models appear in the dropdown
// Examples:
//   displayName: 'My Custom Model Name'
//   displayName: 'GPT-4.1 (Premium)'
//   displayName: 'DeepSeek R1 ⚡ Fast'
//
export const MODEL_CONFIGS = {
  // OpenRouter models
  [AI_MODELS.DEEPSEEK_R1_0528]: {
    maxTokens: 3000,
    temperature: 0.7,
    description: 'DeepSeek R1 - Advanced reasoning model (free)',
    provider: 'OpenRouter',
    displayName: 'DeepSeek R1 (Free)'
  },
  [AI_MODELS.DEEPSEEK_QWEN_0528]: {
    maxTokens: 3000,
    temperature: 0.7,
    description: 'DeepSeek Qwen - Reliable analysis model (free)',
    provider: 'OpenRouter',
    displayName: 'DeepSeek Qwen Distilled (Free)'
  },
  [AI_MODELS.GEMINI_2_FLASH_EXP]: {
    maxTokens: 3000,
    temperature: 0.7,
    description: 'Gemini 2.0 Flash - Fast Google model (free)',
    provider: 'OpenRouter',
    displayName: 'Gemini 2.0 Flash (Free)'
  },
  [AI_MODELS.META_LLAMA_4_MAVERICK]: {
    maxTokens: 3000,
    temperature: 0.7,
    description: 'Llama 4 Maverick - Meta\'s latest model (free)',
    provider: 'OpenRouter',
    displayName: 'Llama 4 Maverick (Free)'
  },
  [AI_MODELS.META_LLAMA_4_SCOUT]: {
    maxTokens: 3000,
    temperature: 0.7,
    description: 'Llama 4 Scout - Efficient Meta model (free)',
    provider: 'OpenRouter',
    displayName: 'Llama 4 Scout (Free)'
  },
  
  // Direct OpenAI models
  [AI_MODELS.OPEN_AI_GPT_4_1]: {
    maxTokens: 3000,
    temperature: 0.7,
    description: 'GPT-4.1 - Most capable OpenAI model',
    provider: 'OpenAI',
    displayName: 'ChatGPT-4.1'
  },
} as const; 