class Router {
  private static routes: { [path: string]: () => void } = {};
  private static basePath: string = import.meta.env.BASE_URL || '/vite-first/'; // Use Vite's BASE_URL

  /**
   * Registers a route with a corresponding screen rendering function.
   */
  public static registerRoute(path: string, renderFn: () => void) {
    const fullPath = this.getFullPath(path);
    this.routes[fullPath] = renderFn;
  }

  /**
   * Executes the rendering logic for the given path.
   */
  public static navigate(path: string, state: any = null) {
    const fullPath = this.getFullPath(path);

    if (this.routes[fullPath]) {
      history.pushState({ ...state, path: fullPath }, '', fullPath);
      this.routes[fullPath](); // Render the corresponding screen
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
      this.routes[fullPath]();
    } else {
      console.error(`Route not found: ${fullPath}`);
    }
  }

  /**
   * Initializes the router by listening for popstate events.
   */
  public static initialize() {
    window.onpopstate = () => this.handlePopState();
  }

  /**
   * Utility: Prepend the base path to a route.
   */
  private static getFullPath(path: string): string {
    return `${this.basePath}${path.replace(/^\//, '')}`; // Ensure path doesn't double up slashes
  }
}

export default Router;
