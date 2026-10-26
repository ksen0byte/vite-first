/** Build configuration: edit these five defaults or the profile overrides. */
export const featureDefaults = {
  languageSwitching: true,
  feedbackModes: true,
  biologicalAge: true,
  advancedAnalysis: true,
  dataTools: true,
} as const;

export type FeatureFlags = Readonly<Record<keyof typeof featureDefaults, boolean>>;

export const featureProfiles = {
  full: {},
  web: {biologicalAge: false},
  desktop: {feedbackModes: false, biologicalAge: false, languageSwitching: false},
} satisfies Record<string, Partial<FeatureFlags>>;

export function resolveFeatureProfile(mode: string): FeatureFlags {
  switch (mode) {
    case 'development':
    case 'production':
    case 'test':
    case 'web':
      return {...featureDefaults, ...featureProfiles.web};
    case 'desktop':
      return {...featureDefaults, ...featureProfiles.desktop};
    case 'full':
      return {...featureDefaults, ...featureProfiles.full};
    default:
      throw new Error(`Unknown feature mode "${mode}". Use web, desktop, or full.`);
  }
}
