import {resolveFeatureProfile} from './feature-profiles.ts';

// Vite supplies MODE from --mode; no runtime configuration or custom global.
export const features = resolveFeatureProfile(import.meta.env.MODE);
