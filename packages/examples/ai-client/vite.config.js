import babel from '@rolldown/plugin-babel'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {

  const env = loadEnv(mode, process.cwd(), "")

  return {
    base: env.BASE,

    server: {
      port: env.PORT,
    },

    plugins: [
      react(),
      babel({ presets: [reactCompilerPreset()] })
    ],
  }
})
