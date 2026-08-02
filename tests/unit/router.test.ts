import { describe, expect, it, vi } from 'vitest';
import Router from '../../src/routing/router.ts';

describe('Router cleanup contract', () => {
  it('cleans active routes once, preserves the active screen for unknown routes, handles popstate, and disposes stale async routes', async () => {
    const container = { innerHTML: 'initial' } as HTMLElement;
    const location = { pathname: '/vite-first/' };
    const pushState = vi.fn((_: unknown, __: string, path: string) => {
      location.pathname = path;
    });
    vi.stubGlobal('window', { location, onpopstate: null });
    vi.stubGlobal('history', { pushState });

    const firstCleanup = vi.fn();
    const secondCleanup = vi.fn();
    const staleCleanup = vi.fn();
    let resolveSlowRoute: ((cleanup: () => void) => void) | undefined;

    Router.initialize(container);
    Router.registerRoute('/router-first', () => firstCleanup);
    Router.registerRoute('/router-second', () => secondCleanup);
    Router.registerRoute('/router-slow', () => new Promise((resolve) => {
      resolveSlowRoute = resolve;
    }));

    Router.navigate('/router-first');
    await Promise.resolve();
    expect(firstCleanup).not.toHaveBeenCalled();

    Router.navigate('/router-missing');
    expect(firstCleanup).not.toHaveBeenCalled();

    Router.navigate('/router-second');
    await Promise.resolve();
    expect(firstCleanup).toHaveBeenCalledTimes(1);
    expect(pushState).toHaveBeenCalledTimes(2);

    location.pathname = '/router-first';
    Router.handlePopState();
    await Promise.resolve();
    expect(secondCleanup).toHaveBeenCalledTimes(1);
    expect(pushState).toHaveBeenCalledTimes(2);

    Router.navigate('/router-slow');
    Router.navigate('/router-second');
    resolveSlowRoute!(staleCleanup);
    await Promise.resolve();
    await Promise.resolve();
    expect(staleCleanup).toHaveBeenCalledTimes(1);
  });
});
