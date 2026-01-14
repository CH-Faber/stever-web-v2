// Shared type definitions for Mindcraft Dashboard
// ============================================
// LLM Provider Types
// ============================================
export const LLM_PROVIDERS = [
    'openai',
    'google',
    'anthropic',
    'xai',
    'deepseek',
    'qwen',
    'mistral',
    'replicate',
    'groq',
    'huggingface',
    'novita',
    'openrouter',
    'glhf',
    'hyperbolic',
    'cerebras',
    'mercury',
];
export const LLM_PROVIDER_INFO = [
    { id: 'openai', name: 'OpenAI', keyName: 'OPENAI_API_KEY' },
    { id: 'google', name: 'Google (Gemini)', keyName: 'GEMINI_API_KEY' },
    { id: 'anthropic', name: 'Anthropic', keyName: 'ANTHROPIC_API_KEY' },
    { id: 'xai', name: 'xAI', keyName: 'XAI_API_KEY' },
    { id: 'deepseek', name: 'DeepSeek', keyName: 'DEEPSEEK_API_KEY' },
    { id: 'qwen', name: 'Qwen', keyName: 'QWEN_API_KEY' },
    { id: 'mistral', name: 'Mistral', keyName: 'MISTRAL_API_KEY' },
    { id: 'replicate', name: 'Replicate', keyName: 'REPLICATE_API_KEY' },
    { id: 'groq', name: 'Groq', keyName: 'GROQCLOUD_API_KEY' },
    { id: 'huggingface', name: 'HuggingFace', keyName: 'HUGGINGFACE_API_KEY' },
    { id: 'novita', name: 'Novita', keyName: 'NOVITA_API_KEY' },
    { id: 'openrouter', name: 'OpenRouter', keyName: 'OPENROUTER_API_KEY' },
    { id: 'glhf', name: 'GLHF', keyName: 'GHLF_API_KEY' },
    { id: 'hyperbolic', name: 'Hyperbolic', keyName: 'HYPERBOLIC_API_KEY' },
    { id: 'cerebras', name: 'Cerebras', keyName: 'CEREBRAS_API_KEY' },
    { id: 'mercury', name: 'Mercury', keyName: 'MERCURY_API_KEY' },
];
