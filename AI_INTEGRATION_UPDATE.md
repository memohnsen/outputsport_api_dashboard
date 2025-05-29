# AI Integration Update: OpenRouter + Direct OpenAI Support

This update adds support for both OpenRouter and direct OpenAI API access, giving users flexibility to choose between free models and premium OpenAI models.

## What's New

### 1. **Dual Provider Support**
- **OpenRouter**: Access to free models (DeepSeek, Gemini, Llama 4)
- **Direct OpenAI**: Premium GPT models through official API

### 2. **Enhanced Model Selection**
The AI Analysis component now includes:
- **Grouped Dropdown**: Models organized by provider (OpenRouter vs OpenAI)
- **Provider Display**: Shows which provider powered each analysis
- **Model Descriptions**: Hover tooltips with model capabilities

### 3. **Smart Client Routing**
The system automatically chooses the correct API client based on model selection:
- `gpt-*` models → Direct OpenAI API
- Other models → OpenRouter API

## Available Models

### OpenRouter Models (Free)
- **DeepSeek R1 0528** - Advanced reasoning model
- **DeepSeek Qwen 0528** - Reliable analysis model (default)
- **Gemini 2.0 Flash Exp** - Fast Google model
- **Llama 4 Maverick** - Meta's latest model
- **Llama 4 Scout** - Efficient Meta model

### OpenAI Models (Premium)
- **GPT-4o** - Most capable OpenAI model
- **GPT-4o Mini** - Fast and cost-effective
- **GPT-4 Turbo** - Advanced reasoning
- **GPT-3.5 Turbo** - Quick and reliable

## Environment Setup

You'll need both API keys in your `.env.local`:

```bash
# OpenRouter API Key (for free models)
OPENROUTER_API_KEY=your_openrouter_api_key_here

# OpenAI API Key (for GPT models)
OPENAI_KEY=your_openai_api_key_here
```

### Getting API Keys

1. **OpenRouter**: Visit https://openrouter.ai/ 
   - Sign up for free access to multiple model providers
   - Free tier includes generous quotas

2. **OpenAI**: Visit https://platform.openai.com/
   - Set up billing for GPT model access
   - Pay-per-use pricing

## Usage

### In the UI
1. Select your preferred model from the dropdown (grouped by provider)
2. Generate analysis as usual
3. View provider information in the results

### Programmatically
```javascript
const response = await fetch('/api/ai/analyze', {
  method: 'POST',
  body: JSON.stringify({
    athleteId: 'athlete-id',
    timeRange: '7days',
    exerciseId: 'exercise-id',
    model: 'gpt-4o' // or any model ID
  })
});
```

## Model Selection Strategy

### For Free Usage
- Start with **DeepSeek Qwen 0528** (default)
- Try **DeepSeek R1** for complex analysis
- Use **Gemini 2.0 Flash** for quick insights

### For Premium Usage
- **GPT-4o** for highest quality analysis
- **GPT-4o Mini** for cost-effective results
- **GPT-3.5 Turbo** for simple tasks

### Fallback Strategy
If one provider is having issues:
1. Try different models from the same provider
2. Switch to the other provider (OpenRouter ↔ OpenAI)
3. Check API key validity and quotas

## Benefits

1. **Reliability**: Multiple providers reduce downtime
2. **Cost Control**: Choose between free and paid models
3. **Performance**: Select the best model for each task
4. **Future-Proof**: Easy to add new providers and models

## Technical Implementation

The system uses a unified OpenAI client interface but routes to different endpoints:
- OpenAI models → `https://api.openai.com/v1/`
- OpenRouter models → `https://openrouter.ai/api/v1/`

Model configurations include provider information and are automatically applied based on selection. 