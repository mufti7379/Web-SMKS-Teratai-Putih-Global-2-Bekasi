import fs from "node:fs";
import path from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { visualEdits } from "@emergentbase/visual-edits/vite";

// Supervisor exports DISABLE_HOT_RELOAD=true when the platform sets ENABLE_RELOAD=false.
const hotReloadDisabled = process.env.DISABLE_HOT_RELOAD === "true";

// Visual Edits (x-* JSX tagging, overlay, /edit-file endpoint) is dev-server-only by
// default (apply: serve); escape hatch mirrors DISABLE_HOT_RELOAD.
const visualEditsDisabled = process.env.DISABLE_VISUAL_EDITS === "true";

// Pod inotify quota is node-shared and routinely exhausted; native fs.watch EMFILEs at
// boot. Polling is the load-bearing default (set before Vite evaluates the config).
if (!hotReloadDisabled) {
  process.env.CHOKIDAR_USEPOLLING = "true";
}

// Vercel answers any URL that vercel.json doesn't route with dist/404.html and a real 404
// status. Make that file the app shell too, so the router renders its "not found" page —
// with the home page's search tags swapped for a noindex.
function notFoundPage(): Plugin {
  return {
    name: "not-found-page",
    apply: "build",
    enforce: "post",
    writeBundle(options) {
      const dir = options.dir ?? path.resolve(__dirname, "dist");
      const shell = fs.readFileSync(path.join(dir, "index.html"), "utf8");
      const head = `<!-- seo:start -->\n    <title>Halaman tidak ditemukan — SMK Teratai Putih Global 2 Bekasi</title>\n    <meta name="robots" content="noindex" />\n    <!-- seo:end -->`;
      fs.writeFileSync(path.join(dir, "404.html"), shell.replace(/<!-- seo:start[^>]*-->[\s\S]*?<!-- seo:end -->/, () => head));
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    ...(visualEditsDisabled ? [] : [visualEdits()]),
    notFoundPage(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Every shipped dep, pre-bundled up front. Vite discovers deps lazily, so the first
  // import outside the initial graph would trigger a re-optimize + reload mid-session.
  optimizeDeps: {
    include: [
      "@base-ui/react/button",
      "@base-ui/react/checkbox",
      "@base-ui/react/dialog",
      "@base-ui/react/input",
      "@base-ui/react/menu",
      "@base-ui/react/merge-props",
      "@base-ui/react/popover",
      "@base-ui/react/select",
      "@base-ui/react/tabs",
      "@base-ui/react/use-render",
      "@tanstack/react-query",
      "class-variance-authority",
      "clsx",
      "date-fns",
      "lucide-react",
      "motion/react",
      "next-themes",
      "react",
      "react-day-picker",
      "react-dom/client",
      "react-is",
      "react-router-dom",
      "recharts",
      "sonner",
      "tailwind-merge",
    ],
  },
  server: {
    host: true,
    port: 3000,
    allowedHosts: true,
    // No hmr.clientPort override: Vite infers the WS target from window.location, which
    // is correct on both localhost:3000 (smoke) and the https/:443 preview proxy.
    hmr: !hotReloadDisabled,
    watch: hotReloadDisabled ? null : { usePolling: true, interval: 300 },
    // The app imports one module from ../api/_lib (news URL logic shared with the Vercel
    // functions), which sits outside this package — let the dev server serve it.
    fs: { allow: [path.resolve(__dirname, "..")] },
    // The /api proxy convention: frontend code calls relative /api/*, never an
    // absolute backend URL. Target is the FastAPI dev server (supervisor: backend).
    proxy: {
      "/api": {
        target: "http://localhost:8001",
        changeOrigin: true,
      },
    },
  },
});
