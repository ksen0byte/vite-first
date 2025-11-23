class Router {
  private static routes: { [path: string]: () => void } = {};
  private static basePath: string = import.meta.env.BASE_URL || '/vite-first/'; // Use Vite's BASE_URL
  private static appContainer: HTMLElement;

  /**
   * Initializes the router with the ID of the main container element
   * and sets up the event listener for handling browser navigation events.
   */
  public static initialize(appContainer: HTMLElement) {
    this.appContainer = appContainer;
    window.onpopstate = () => this.handlePopState();
  }

  /**
   * Registers a route with a corresponding screen rendering function.
   */
  public static registerRoute(path: string, renderFn: () => void) {
    const fullPath = this.getFullPath(path);
    this.routes[fullPath] = renderFn;
  }

  /**
   * Executes the rendering logic for the given path and performs cleanup.
   */
  public static navigate<TState = unknown>(path: string, state?: TState) {
    const fullPath = this.getFullPath(path);

    if (this.routes[fullPath]) {
      this.cleanup(); // Clean up the container and remove event listeners

      // Push new state into history
      const nextState = (state ? { ...state } : {}) as TState extends object ? TState : Record<string, never>;
      history.pushState({ ...nextState, path: fullPath }, '', fullPath);

      // Render the corresponding screen
      this.routes[fullPath]();
    } else {
      console.error(`Route not found: ${path}`); // Handle 404
    }
  }

  /**
   * Handles "back" and "forward" navigation.
   */
  public static handlePopState() {
    const fullPath = window.location.pathname;

    if (this.routes[fullPath]) {
      this.cleanup(); // Clean up the container and remove event listeners
      this.routes[fullPath]();
    } else {
      console.error(`Route not found: ${fullPath}`);
    }
  }

  /**
   * Cleans up by clearing the app container's contents.
   * Automatically removes all event listeners tied to the current route's DOM elements.
   */
  private static cleanup() {
    if (this.appContainer) {
      this.appContainer.innerHTML = ''; // Clear all content to remove event listeners
    }
  }

  /**
   * Utility: Prepend the base path to a route.
   */
  private static getFullPath(path: string): string {
    return `${this.basePath}${path.replace(/^\//, '')}`; // Ensure path doesn't double up slashes
  }
}

export default Router;
