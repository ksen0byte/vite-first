import { defineConfig } from 'vite'

export default defineConfig({
    base: process.env.VITE_ASSET_BASE ?? '/vite-first/'
})
