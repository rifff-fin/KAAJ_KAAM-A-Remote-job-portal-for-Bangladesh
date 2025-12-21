// vite.config.js
import { defineConfig } from "file:///D:/KAAJ_KAAM-A%20Remote_job_portal_for_Bangladesh/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///D:/KAAJ_KAAM-A%20Remote_job_portal_for_Bangladesh/frontend/node_modules/@vitejs/plugin-react/dist/index.js";
import svgr from "file:///D:/KAAJ_KAAM-A%20Remote_job_portal_for_Bangladesh/frontend/node_modules/vite-plugin-svgr/dist/index.js";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    svgr()
  ],
  server: {
    port: 3e3,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        // ✅ fixed port
        changeOrigin: true
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxLQUFKX0tBQU0tQSBSZW1vdGVfam9iX3BvcnRhbF9mb3JfQmFuZ2xhZGVzaFxcXFxmcm9udGVuZFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxcS0FBSl9LQUFNLUEgUmVtb3RlX2pvYl9wb3J0YWxfZm9yX0JhbmdsYWRlc2hcXFxcZnJvbnRlbmRcXFxcdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L0tBQUpfS0FBTS1BJTIwUmVtb3RlX2pvYl9wb3J0YWxfZm9yX0JhbmdsYWRlc2gvZnJvbnRlbmQvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcclxuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0JztcclxuaW1wb3J0IHN2Z3IgZnJvbSAndml0ZS1wbHVnaW4tc3Zncic7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xyXG4gIHBsdWdpbnM6IFtcclxuICAgIHJlYWN0KCksXHJcbiAgICBzdmdyKClcclxuICBdLFxyXG4gIHNlcnZlcjoge1xyXG4gICAgcG9ydDogMzAwMCxcclxuICAgIHByb3h5OiB7XHJcbiAgICAgICcvYXBpJzoge1xyXG4gICAgICAgIHRhcmdldDogJ2h0dHA6Ly9sb2NhbGhvc3Q6ODA4MCcsIC8vIFx1MjcwNSBmaXhlZCBwb3J0XHJcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlXHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbn0pO1xyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQWtXLFNBQVMsb0JBQW9CO0FBQy9YLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFFakIsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLElBQ04sS0FBSztBQUFBLEVBQ1A7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE9BQU87QUFBQSxNQUNMLFFBQVE7QUFBQSxRQUNOLFFBQVE7QUFBQTtBQUFBLFFBQ1IsY0FBYztBQUFBLE1BQ2hCO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
