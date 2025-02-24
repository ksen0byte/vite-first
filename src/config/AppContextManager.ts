import {AppContext} from "./domain.ts";
import {defaultAppContext} from "./settings.ts";

class AppContextManager {
  private static instance: AppContext;

  private constructor() {}

  public static getContext(): AppContext {
    if (!this.instance) {
      this.instance = defaultAppContext;
    }

    return this.instance;
  }

  public static setContext(newContext: Partial<AppContext>) {
    this.instance = {...this.instance, ...newContext};
  }
}

// Usage Example:
export default AppContextManager;