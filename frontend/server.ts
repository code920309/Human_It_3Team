import express from "express";
import { createServer as createViteServer, loadEnv } from "vite";
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Mock database for health data
  let mockHealthData: any[] = [];

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "CareLink Backend is running" });
  });

  app.get("/api/health-data/latest", (req, res) => {
    if (mockHealthData.length > 0) {
      res.json({ data: mockHealthData[mockHealthData.length - 1] });
    } else {
      res.status(404).json({ message: "No health data found" });
    }
  });

  app.post("/api/health-data", express.json(), (req, res) => {
    const newData = req.body;
    mockHealthData.push(newData);
    res.status(201).json({ message: "Health data saved successfully" });
  });

  app.delete("/api/health-data", (req, res) => {
    mockHealthData = [];
    res.json({ message: "All health data cleared" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const env = loadEnv(process.env.NODE_ENV || 'development', __dirname, '');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: "spa",
      configFile: false,
      plugins: [react(), tailwindcss()],
      define: {
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      },
      resolve: {
        alias: {
          '@': __dirname,
        },
      },
      root: __dirname,
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
