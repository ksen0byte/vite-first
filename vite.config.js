import { defineConfig } from 'vite'
import { resolveFeatureProfile } from './src/config/feature-profiles.ts'

export default defineConfig(({mode}) => {
    resolveFeatureProfile(mode) // Reject unknown modes before building or serving.
    return {
        base: process.env.VITE_ASSET_BASE ?? '/vite-first/',
        server: {
            watch: {
                ignored: ["**/src-tauri/**"],
            },
        },
    }
})
