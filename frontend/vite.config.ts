import vue from "@vitejs/plugin-vue";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backend = env.VITE_API_PROXY_TARGET || "http://localhost:19205";
  return {
    plugins: [vue()],
    server: {
      port: 18705,
      proxy: {
        "/api": backend,
        "/health": backend
      }
    }
  };
});
