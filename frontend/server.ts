import express from "express";
import { createServer as createViteServer } from "vite";
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
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
      root: path.join(process.cwd(), "frontend"),
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
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
