import { apiRequest } from './services/api';
import { authStore } from './stores/auth';

const fail = (message) => { throw new Error(message); };

export function registerWebMcpTools(router) {
  const context = typeof document === 'undefined' ? undefined : document.modelContext;
  if (!context?.registerTool) return;

  const lifecycle = new AbortController();
  const register = (tool) => {
    try {
      Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(console.error);
    } catch (error) {
      console.error(error);
    }
  };

  register({
    name: 'search_auctions',
    title: 'Search auctions',
    description: 'Search public GrooveGavel lots by record name and return up to 20 results.',
    inputSchema: {
      type: 'object',
      properties: { query: { type: 'string', maxLength: 100 } },
      additionalProperties: false
    },
    annotations: { readOnlyHint: true, untrustedContentHint: true },
    async execute(input) {
      if (input?.query !== undefined && typeof input.query !== 'string') fail('query must be a string');
      const params = new URLSearchParams({ limit: '20', offset: '0' });
      if (input?.query?.trim()) params.set('q', input.query.trim());
      const items = await apiRequest(`/search?${params}`);
      return { items };
    }
  });

  register({
    name: 'create_auction',
    title: 'Create auction',
    description: 'Create a lot with the current account and open its detail page.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', minLength: 1, maxLength: 100 },
        description: { type: 'string', minLength: 1, maxLength: 2000 },
        startingBid: { type: 'integer', minimum: 0 },
        endDate: { type: 'integer', description: 'Future Unix timestamp in milliseconds' }
      },
      required: ['name', 'description', 'startingBid', 'endDate'],
      additionalProperties: false
    },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    async execute(input) {
      if (!authStore.isAuthenticated) fail('Sign in before creating an auction');
      if (!input || typeof input.name !== 'string' || !input.name.trim()) fail('name is required');
      if (typeof input.description !== 'string' || !input.description.trim()) fail('description is required');
      if (!Number.isSafeInteger(input.startingBid) || input.startingBid < 0) fail('startingBid must be a non-negative integer');
      if (!Number.isSafeInteger(input.endDate) || input.endDate <= Date.now()) fail('endDate must be a future timestamp in milliseconds');

      const result = await apiRequest('/item', {
        method: 'POST',
        token: authStore.state.token,
        body: {
          name: input.name.trim(),
          description: input.description.trim(),
          starting_bid: input.startingBid,
          end_date: input.endDate
        }
      });
      await router.push(`/items/${result.item_id}`);
      return { itemId: result.item_id, status: 'created' };
    }
  });

  return () => lifecycle.abort();
}
