export type Cleanup = () => void;
export type RouteRender = () => void | Cleanup | Promise<void | Cleanup>;

const noCleanup: Cleanup = () => {};

class Router {
  private static routes: Record<string, RouteRender> = {};
  private static readonly basePath = Router.normalizeBasePath(import.meta.env.BASE_URL);
  private static appContainer: HTMLElement;
  private static activeCleanup: Cleanup = noCleanup;
  private static navigationGeneration = 0;

  public static initialize(appContainer: HTMLElement): void {
    this.appContainer = appContainer;
    window.onpopstate = () => this.handlePopState();
  }

  public static registerRoute(path: string, renderFn: RouteRender): void {
    this.routes[this.getFullPath(path)] = renderFn;
  }

  public static navigate<TState extends object = Record<string, never>>(path: string, state?: TState): void {
    const fullPath = this.getFullPath(path);
    const nextState = state ?? ({} as TState);
    this.mount(fullPath, () => history.pushState({ ...nextState, path: fullPath }, '', fullPath));
  }

  public static handlePopState(): void {
    this.mount(window.location.pathname);
  }

  private static mount(fullPath: string, updateHistory: () => void = () => {}): void {
    const renderRoute = this.routes[fullPath];
    if (!renderRoute) {
      console.error(`Route not found: ${fullPath}`);
      return;
    }

    this.runActiveCleanup();
    this.appContainer.innerHTML = '';
    updateHistory();

    const generation = ++this.navigationGeneration;
    Promise.resolve(renderRoute()).then((cleanup) => {
      const resolvedCleanup = cleanup ?? noCleanup;
      if (generation !== this.navigationGeneration) {
        resolvedCleanup();
        return;
      }
      this.activeCleanup = resolvedCleanup;
    });
  }

  private static runActiveCleanup(): void {
    const cleanup = this.activeCleanup;
    this.activeCleanup = noCleanup;
    cleanup();
  }

  private static normalizeBasePath(basePath: string): string {
    return `/${basePath.replace(/^\/+|\/+$/g, '')}/`;
  }

  private static getFullPath(path: string): string {
    const normalizedPath = path.replace(/^\/+/, '');
    return normalizedPath ? `${this.basePath}${normalizedPath}` : this.basePath;
  }
}

export default Router;
