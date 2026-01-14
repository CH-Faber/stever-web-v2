/**
 * Model Search and Filter Utilities
 * 
 * Implements fuzzy search and capability filtering for model selection.
 * Validates: Requirements 1.2, 5.2
 */

import type { ModelInfo, ModelCapability } from '../../../shared/types';

/**
 * Model search options
 */
export interface ModelSearchOptions {
  /** Search query string for fuzzy matching */
  query?: string;
  /** Filter by specific capabilities */
  capabilities?: ModelCapability[];
  /** Purpose filter - prioritizes models with matching capabilities */
  purpose?: 'main' | 'code' | 'vision' | 'embedding';
}

/**
 * Model search result with relevance score
 */
export interface ModelSearchResult {
  model: ModelInfo;
  score: number;
}

/**
 * Maps purpose to required capabilities
 */
const PURPOSE_CAPABILITY_MAP: Record<string, ModelCapability[]> = {
  main: ['text', 'function_calling'],
  code: ['code'],
  vision: ['vision'],
  embedding: ['embedding'],
};

/**
 * Performs fuzzy search on a string
 * Returns a score between 0 and 1, where 1 is an exact match
 * 
 * @param text - The text to search in
 * @param query - The search query
 * @returns Score between 0 and 1
 */
export function fuzzyMatch(text: string, query: string): number {
  if (!query || query.trim() === '') {
    return 1; // Empty query matches everything
  }

  const normalizedText = text.toLowerCase();
  const normalizedQuery = query.toLowerCase().trim();

  // Exact match
  if (normalizedText === normalizedQuery) {
    return 1;
  }

  // Contains match
  if (normalizedText.includes(normalizedQuery)) {
    // Score based on how much of the text the query covers
    return 0.8 + (normalizedQuery.length / normalizedText.length) * 0.2;
  }

  // Fuzzy character matching
  let queryIndex = 0;
  let matchedChars = 0;
  let consecutiveBonus = 0;
  let lastMatchIndex = -2;

  for (let i = 0; i < normalizedText.length && queryIndex < normalizedQuery.length; i++) {
    if (normalizedText[i] === normalizedQuery[queryIndex]) {
      matchedChars++;
      // Bonus for consecutive matches
      if (i === lastMatchIndex + 1) {
        consecutiveBonus += 0.1;
      }
      lastMatchIndex = i;
      queryIndex++;
    }
  }

  // All query characters must be found in order
  if (queryIndex < normalizedQuery.length) {
    return 0;
  }

  // Calculate score based on matched characters and bonuses
  const baseScore = matchedChars / normalizedQuery.length;
  const lengthPenalty = Math.min(1, normalizedQuery.length / normalizedText.length);
  
  return Math.min(0.7, baseScore * 0.5 + lengthPenalty * 0.2 + consecutiveBonus);
}

/**
 * Checks if a model has any of the specified capabilities
 * 
 * @param model - The model to check
 * @param capabilities - The capabilities to look for
 * @returns True if the model has at least one of the capabilities
 */
export function hasCapability(model: ModelInfo, capabilities: ModelCapability[]): boolean {
  if (!capabilities || capabilities.length === 0) {
    return true;
  }
  return capabilities.some(cap => model.capabilities.includes(cap));
}

/**
 * Checks if a model has all of the specified capabilities
 * 
 * @param model - The model to check
 * @param capabilities - The capabilities required
 * @returns True if the model has all the capabilities
 */
export function hasAllCapabilities(model: ModelInfo, capabilities: ModelCapability[]): boolean {
  if (!capabilities || capabilities.length === 0) {
    return true;
  }
  return capabilities.every(cap => model.capabilities.includes(cap));
}

/**
 * Calculates capability match score for a model
 * 
 * @param model - The model to score
 * @param requiredCapabilities - The capabilities to match against
 * @returns Score between 0 and 1
 */
function calculateCapabilityScore(model: ModelInfo, requiredCapabilities: ModelCapability[]): number {
  if (!requiredCapabilities || requiredCapabilities.length === 0) {
    return 1;
  }

  const matchedCount = requiredCapabilities.filter(cap => 
    model.capabilities.includes(cap)
  ).length;

  return matchedCount / requiredCapabilities.length;
}

/**
 * Searches and filters models based on query and options
 * 
 * Validates: Requirement 1.2 - WHEN 用户搜索模型 THEN Model_Selector SHALL 支持按模型名称、能力标签进行模糊搜索
 * Validates: Requirement 5.2 - WHEN 用户为特定用途选择模型 THEN Model_Selector SHALL 优先显示具有相应能力的模型
 * 
 * @param models - The list of models to search
 * @param options - Search and filter options
 * @returns Filtered and sorted list of models with scores
 */
export function searchModels(
  models: ModelInfo[],
  options: ModelSearchOptions = {}
): ModelSearchResult[] {
  const { query, capabilities, purpose } = options;

  // Determine required capabilities from purpose or explicit capabilities
  const requiredCapabilities = capabilities || 
    (purpose ? PURPOSE_CAPABILITY_MAP[purpose] : undefined);

  const results: ModelSearchResult[] = [];

  for (const model of models) {
    // Calculate text match score (name, id, description, capabilities)
    let textScore = 0;
    
    if (query && query.trim() !== '') {
      const nameScore = fuzzyMatch(model.name, query);
      const idScore = fuzzyMatch(model.id, query);
      const descScore = model.description ? fuzzyMatch(model.description, query) : 0;
      
      // Check if query matches any capability
      const capabilityScore = model.capabilities.some(cap => 
        cap.toLowerCase().includes(query.toLowerCase())
      ) ? 0.7 : 0;

      // Take the best match
      textScore = Math.max(nameScore, idScore, descScore, capabilityScore);

      // Skip models with no text match when query is provided
      if (textScore === 0) {
        continue;
      }
    } else {
      textScore = 1; // No query means all models match
    }

    // Calculate capability score
    const capabilityScore = calculateCapabilityScore(model, requiredCapabilities || []);

    // Combined score: text match is primary, capability is secondary for sorting
    // Models with matching capabilities get a boost
    const combinedScore = textScore * 0.6 + capabilityScore * 0.4;

    results.push({
      model,
      score: combinedScore,
    });
  }

  // Sort by score (descending), then by name (ascending) for stable sort
  results.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.model.name.localeCompare(b.model.name);
  });

  return results;
}

/**
 * Filters models by capability
 * 
 * Validates: Requirement 5.2 - capability filtering
 * 
 * @param models - The list of models to filter
 * @param capability - The capability to filter by
 * @returns Filtered list of models that have the capability
 */
export function filterByCapability(
  models: ModelInfo[],
  capability: ModelCapability
): ModelInfo[] {
  return models.filter(model => model.capabilities.includes(capability));
}

/**
 * Filters models by purpose, prioritizing models with matching capabilities
 * Models with matching capabilities appear first, followed by others
 * 
 * Validates: Requirement 5.2 - WHEN 用户为特定用途选择模型 THEN Model_Selector SHALL 优先显示具有相应能力的模型
 * 
 * @param models - The list of models to filter
 * @param purpose - The intended purpose (main, code, vision, embedding)
 * @returns Sorted list with matching models first
 */
export function filterByPurpose(
  models: ModelInfo[],
  purpose: 'main' | 'code' | 'vision' | 'embedding'
): ModelInfo[] {
  const requiredCapabilities = PURPOSE_CAPABILITY_MAP[purpose] || [];
  
  // Separate models into those with and without matching capabilities
  const withCapability: ModelInfo[] = [];
  const withoutCapability: ModelInfo[] = [];

  for (const model of models) {
    if (hasCapability(model, requiredCapabilities)) {
      withCapability.push(model);
    } else {
      withoutCapability.push(model);
    }
  }

  // Return matching models first, then others
  return [...withCapability, ...withoutCapability];
}

/**
 * Simple search function that returns matching models
 * Convenience wrapper around searchModels
 * 
 * @param models - The list of models to search
 * @param query - The search query
 * @returns List of matching models (without scores)
 */
export function simpleSearch(models: ModelInfo[], query: string): ModelInfo[] {
  const results = searchModels(models, { query });
  return results.map(r => r.model);
}

export default {
  fuzzyMatch,
  hasCapability,
  hasAllCapabilities,
  searchModels,
  filterByCapability,
  filterByPurpose,
  simpleSearch,
};
