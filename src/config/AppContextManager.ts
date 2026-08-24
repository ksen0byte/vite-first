import {AppContext} from "./domain.ts";
import {defaultAppContext} from "./settings.ts";

/**
 * Holds the active application context. Values are stored by reference but
 * handed out as structural clones, so callers can never mutate the stored
 * state (or the frozen factory defaults) through the returned object.
 */
class AppContextManager {
  private static instance: AppContext;

  private constructor() {}

  public static getContext(): AppContext {
    if (!this.instance) {
      this.instance = defaultAppContext;
    }

    return AppContextManager.clone(this.instance);
  }

  public static setContext(newContext: AppContext) {
    this.instance = newContext;
  }

  /** Structural copy: nested objects (personalData, testSettings, feedback) are duplicated. */
  private static clone(context: AppContext): AppContext {
    return {
      ...context,
      personalData: {...context.personalData},
      testSettings: {
        ...context.testSettings,
        exposureDelay: [...context.testSettings.exposureDelay],
        feedback: {...context.testSettings.feedback},
        usePregenerated: {...context.testSettings.usePregenerated},
      },
    };
  }
}

// Usage Example:
export default AppContextManager;
