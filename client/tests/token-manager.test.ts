import { beforeEach, describe, expect, it, vi } from 'vitest';

import { tokenManager } from '@/app/api';

const authStorageKey = 'xposure_auth_tokens';

const createStorage = (): Storage => {
  const values = new Map<string, string>();

  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => Array.from(values.keys())[index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  };
};

describe('tokenManager', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createStorage());
  });

  it('stores and retrieves access and refresh tokens', () => {
    tokenManager.setTokens('access-token', 'refresh-token');

    expect(tokenManager.getAccessToken()).toBe('access-token');
    expect(tokenManager.getRefreshToken()).toBe('refresh-token');
  });

  it('clears tokens when either token is missing', () => {
    tokenManager.setTokens('access-token', 'refresh-token');
    tokenManager.setTokens('', 'refresh-token');

    expect(localStorage.getItem(authStorageKey)).toBeNull();
    expect(tokenManager.getAccessToken()).toBeNull();
  });

  it('treats corrupted stored data as an unauthenticated session', () => {
    localStorage.setItem(authStorageKey, 'not-json');

    expect(tokenManager.getAccessToken()).toBeNull();
    expect(tokenManager.getRefreshToken()).toBeNull();
  });
});