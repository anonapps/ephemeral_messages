export const MAX_BYTES = 100 * 1024;
export const SOFT_WARNING_BYTES = 50 * 1024;
export const REVEAL_SECONDS = 60;

export const TTL_OPTIONS = [
  { label: '1 hour', value: 60 * 60 },
  { label: '6 hours', value: 6 * 60 * 60 },
  { label: '24 hours', value: 24 * 60 * 60 },
] as const;
