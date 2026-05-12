/**
 * POST /api/internal/video/[id]/search
 *
 * Video Clip Search Endpoint for Phase 4 Edit Mode
 *
 * Searches clips by description using semantic search and keyword matching.
 * This endpoint simulates AI-powered content-based video search that
 * finds relevant clips based on natural language queries.
 *
 * In production, this would:
 * - Use vector embeddings for semantic search
 * - Perform full-text search on transcripts and metadata
 * - Support filtering by time range, duration, and clip type
 * - Return relevance-ranked results with scores
 *
 * Route Parameters:
 * - id: string (required) - Video asset ID
 *
 * Request Body:
 * {
 *   query: string; // Natural language search query
 *   startTime?: number; // Filter clips starting after this time (seconds)
 *   endTime?: number; // Filter clips ending before this time (seconds)
 *   clipType?: 'scene' | 'shot' | 'semantic' | 'all';
 *   maxResults?: number; // Maximum number of results (default: 10)
 *   minRelevance?: number; // Minimum relevance score 0-1 (default: 0.5)
 * }
 *
 * Response:
 * {
 *   assetId: string;
 *   query: string;
 *   results: Array<{
 *     clipId: string;
 *     startTime: number;
 *     endTime: number;
 *     duration: number;
 *     type: string;
 *     title: string;
 *     description: string;
 *     relevanceScore: number;
 *     matchedTerms: string[];
 *     thumbnailUrl: string;
 *   }>;
 *   totalResults: number;
 *   searchTime: number; // milliseconds
 * }
 *
 * @module pages/api/internal/video/[id]/search
 * @version 1.0.0
 * @mock Implementation
 */

import type { APIRoute } from 'astro';
import { getSession } from '@/lib/auth/session-adapter';

/**
 * Mock clip data generator (same as clips endpoint)
 */
function generateMockClips(assetId: string) {
  const hash = assetId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  const totalDuration = 120 + (hash % 480);
  const sceneCount = 5 + (hash % 8);
  const avgSceneDuration = totalDuration / sceneCount;
  const clips: any[] = [];
  let seed = hash;

  const sceneTypes = [
    'Introduction', 'Opening Sequence', 'Title Scene',
    'Main Content', 'Discussion', 'Presentation',
    'Demonstration', 'Example', 'Case Study',
    'Analysis', 'Explanation', 'Summary',
    'Conclusion', 'Closing', 'End Credits'
  ];

  const topics = [
    'Product Overview', 'Feature Demonstration', 'Tutorial',
    'Interview', 'Testimonial', 'Review', 'Comparison',
    'Background Information', 'Key Concepts', 'Best Practices',
    'Tips and Tricks', 'Common Issues', 'FAQ', 'Q&A Session'
  ];

  for (let i = 0; i < sceneCount; i++) {
    const startTime = i * avgSceneDuration;
    const duration = avgSceneDuration * (0.8 + seededRandom(seed++) * 0.4);
    const endTime = Math.min(startTime + duration, totalDuration);

    clips.push({
      id: `clip_scene_${i + 1}`,
      startTime: Math.round(startTime * 100) / 100,
      endTime: Math.round(endTime * 100) / 100,
      duration: Math.round((endTime - startTime) * 100) / 100,
      type: 'scene',
      title: `${sceneTypes[(hash + i) % sceneTypes.length]} - ${topics[(hash + i + 3) % topics.length]}`,
      description: `Scene ${i + 1}: ${topics[(hash + i + 5) % topics.length]} section with key content`,
      confidence: 0.85 + seededRandom(seed++) * 0.14,
      thumbnailUrl: `/api/internal/video/${assetId}/thumbnail?t=${Math.round(startTime)}`
    });
  }

  return { clips, totalDuration };
}

/**
 * Calculate relevance score for a clip based on search query
 *
 * Uses keyword matching and semantic similarity (mocked).
 */
function calculateRelevance(query: string, clip: any): number {
  const queryLower = query.toLowerCase();
  const titleLower = clip.title.toLowerCase();
  const descLower = clip.description.toLowerCase();
  const queryTerms = queryLower.split(/\s+/).filter(t => t.length > 2);

  let score = 0;
  const matchedTerms: string[] = [];

  // Exact phrase match (highest score)
  if (titleLower.includes(queryLower) || descLower.includes(queryLower)) {
    score += 0.5;
  }

  // Individual term matching
  for (const term of queryTerms) {
    if (titleLower.includes(term)) {
      score += 0.2;
      matchedTerms.push(term);
    }
    if (descLower.includes(term) && !matchedTerms.includes(term)) {
      score += 0.15;
      matchedTerms.push(term);
    }
  }

  // Semantic similarity (mocked based on query keywords)
  const semanticKeywords: Record<string, string[]> = {
    'intro': ['introduction', 'opening', 'beginning', 'start', 'overview'],
    'demo': ['demonstration', 'example', 'show', 'tutorial', 'how-to'],
    'discussion': ['talk', 'conversation', 'interview', 'chat', 'dialog'],
    'conclusion': ['summary', 'ending', 'closing', 'wrap-up', 'final'],
    'product': ['overview', 'features', 'review', 'comparison'],
    'tutorial': ['guide', 'how-to', 'instructions', 'steps', 'learn'],
    'tips': ['tricks', 'advice', 'recommendations', 'best practices']
  };

  for (const [key, synonyms] of Object.entries(semanticKeywords)) {
    if (queryLower.includes(key)) {
      for (const synonym of synonyms) {
        if (titleLower.includes(synonym) || descLower.includes(synonym)) {
          score += 0.1;
          if (!matchedTerms.includes(synonym)) {
            matchedTerms.push(synonym);
          }
        }
      }
    }
  }

  // Boost score for clip confidence
  score *= clip.confidence;

  // Normalize to 0-1 range
  return Math.min(score, 1.0);
}

/**
 * POST handler for video clip search endpoint
 */
export const POST: APIRoute = async ({ request, cookies, params }) => {
  try {
    // =========================================================================
    // 1. Authenticate User
    // =========================================================================
    const session = await getSession(request, cookies);
    if (!session?.user?.id) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // =========================================================================
    // 2. Validate Asset ID
    // =========================================================================
    const assetId = params.id;

    if (!assetId) {
      return new Response(
        JSON.stringify({
          error: 'Validation Error',
          details: 'Asset ID is required'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // =========================================================================
    // 3. Parse and Validate Request Body
    // =========================================================================
    const body = await request.json();
    const {
      query,
      startTime,
      endTime,
      clipType = 'all',
      maxResults = 10,
      minRelevance = 0.5
    } = body as {
      query: string;
      startTime?: number;
      endTime?: number;
      clipType?: 'scene' | 'shot' | 'semantic' | 'all';
      maxResults?: number;
      minRelevance?: number;
    };

    // Validate search query
    if (!query?.trim()) {
      return new Response(
        JSON.stringify({
          error: 'Validation Error',
          details: 'Search query is required'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate maxResults
    if (maxResults < 1 || maxResults > 100) {
      return new Response(
        JSON.stringify({
          error: 'Validation Error',
          details: 'maxResults must be between 1 and 100'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate minRelevance
    if (minRelevance < 0 || minRelevance > 1) {
      return new Response(
        JSON.stringify({
          error: 'Validation Error',
          details: 'minRelevance must be between 0 and 1'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // =========================================================================
    // 4. Generate Mock Clips and Calculate Relevance
    // =========================================================================
    const searchStartTime = Date.now();
    console.log(`[Video Search] Searching clips for asset ${assetId} with query: "${query}"`);

    const { clips, totalDuration } = generateMockClips(assetId);

    // Calculate relevance scores for all clips
    const resultsWithScores = clips.map(clip => {
      const relevanceScore = calculateRelevance(query, clip);
      const queryLower = query.toLowerCase();
      const titleLower = clip.title.toLowerCase();
      const descLower = clip.description.toLowerCase();

      // Extract matched terms
      const matchedTerms: string[] = [];
      const queryTerms = queryLower.split(/\s+/).filter(t => t.length > 2);
      for (const term of queryTerms) {
        if (titleLower.includes(term) || descLower.includes(term)) {
          if (!matchedTerms.includes(term)) {
            matchedTerms.push(term);
          }
        }
      }

      return {
        ...clip,
        relevanceScore,
        matchedTerms
      };
    });

    // Filter by relevance threshold
    const filteredResults = resultsWithScores.filter(
      result => result.relevanceScore >= minRelevance
    );

    // Filter by time range if specified
    let timeFilteredResults = filteredResults;
    if (startTime !== undefined) {
      timeFilteredResults = timeFilteredResults.filter(
        result => result.startTime >= startTime
      );
    }
    if (endTime !== undefined) {
      timeFilteredResults = timeFilteredResults.filter(
        result => result.endTime <= endTime
      );
    }

    // Filter by clip type if specified
    let typeFilteredResults = timeFilteredResults;
    if (clipType !== 'all') {
      typeFilteredResults = typeFilteredResults.filter(
        result => result.type === clipType
      );
    }

    // Sort by relevance score (descending) and limit results
    const sortedResults = typeFilteredResults
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, maxResults);

    // Format results for response
    const formattedResults = sortedResults.map(result => ({
      clipId: result.id,
      startTime: result.startTime,
      endTime: result.endTime,
      duration: result.duration,
      type: result.type,
      title: result.title,
      description: result.description,
      relevanceScore: Math.round(result.relevanceScore * 1000) / 1000,
      matchedTerms: result.matchedTerms,
      thumbnailUrl: result.thumbnailUrl
    }));

    const searchTime = Date.now() - searchStartTime;

    // =========================================================================
    // 5. Return Search Results
    // =========================================================================
    return new Response(
      JSON.stringify({
        assetId,
        query,
        results: formattedResults,
        totalResults: formattedResults.length,
        totalDuration,
        searchTime,
        filters: {
          startTime,
          endTime,
          clipType,
          minRelevance
        },
        searchedAt: new Date().toISOString()
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Video Search] Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Search failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

/**
 * GET /api/internal/video/[id]/search
 *
 * Get search capabilities and perform simple query-based search
 *
 * Query Parameters:
 * - q: string - Search query
 * - maxResults?: number - Maximum results (default: 10)
 *
 * Response: Same as POST but simplified
 */
export const GET: APIRoute = async ({ request, cookies, params }) => {
  try {
    const session = await getSession(request, cookies);
    if (!session?.user?.id) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const assetId = params.id;
    if (!assetId) {
      return new Response(
        JSON.stringify({ error: 'Asset ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(request.url);
    const query = url.searchParams.get('q');
    const maxResults = parseInt(url.searchParams.get('maxResults') || '10');

    if (!query) {
      // Return search capabilities
      return new Response(
        JSON.stringify({
          assetId,
          capabilities: {
            fullTextSearch: true,
            semanticSearch: true,
            filters: ['startTime', 'endTime', 'clipType'],
            maxResults: 100,
            supportedClipTypes: ['scene', 'shot', 'semantic', 'all']
          },
          usage: 'POST with search query body, or GET with ?q=query parameter'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Perform search using POST logic
    const mockBody = {
      query,
      maxResults,
      clipType: 'all',
      minRelevance: 0.3
    };

    // Reuse POST logic by constructing a mock request
    const mockRequest = new Request(request.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockBody)
    });

    // Call POST handler
    return POST({ request: mockRequest, cookies, params });

  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Search failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
