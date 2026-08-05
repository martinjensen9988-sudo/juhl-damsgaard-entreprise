import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

/**
 * Cached entity list/query helper backed by @tanstack/react-query.
 * Reduces loading-spinner flicker when navigating between pages that reuse the
 * same data, since results are served from cache while refetching in the background.
 *
 * @param {string} entity        - entity name, e.g. 'Task'
 * @param {object} opts
 * @param {string} opts.sort     - sort field, e.g. '-created_date'
 * @param {number} opts.limit    - max records
 * @param {object} opts.filter   - filter query
 * @param {string} opts.key      - extra cache namespace (e.g. 'ma-home')
 * @param {boolean} opts.enabled
 */
export function useEntityList(entity, { sort, limit, filter, key = 'list', enabled = true } = {}) {
  return useQuery({
    queryKey: [entity, key, { sort, limit, filter }],
    queryFn: async () => {
      if (filter) return await base44.entities[entity].filter(filter, sort, limit);
      return await base44.entities[entity].list(sort, limit);
    },
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

/** Returns a function to invalidate all cached queries for an entity. */
export function useInvalidateEntities() {
  const qc = useQueryClient();
  return (entity) => qc.invalidateQueries({ queryKey: [entity] });
}