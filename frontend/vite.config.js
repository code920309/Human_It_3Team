import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import express from 'express';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  
  // Mock database for health data
  let mockHealthData = [];

  return {
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'api-server',
        configureServer(server) {
          server.middlewares.use(express.json());
          server.middlewares.use((req, res, next) => {
            if (req.url === '/api/health' && req.method === 'GET') {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ status: "ok", message: "CareLink Backend is running via Vite" }));
            } else if (req.url === '/api/health-data/latest' && req.method === 'GET') {
              res.setHeader('Content-Type', 'application/json');
              if (mockHealthData.length > 0) {
                res.end(JSON.stringify({ data: mockHealthData[mockHealthData.length - 1] }));
              } else {
                res.statusCode = 404;
                res.end(JSON.stringify({ message: "No health data found" }));
              }
            } else if (req.url === '/api/health-data' && req.method === 'POST') {
              let body = '';
              req.on('data', chunk => { body += chunk.toString(); });
              req.on('end', () => {
                const newData = JSON.parse(body);
                mockHealthData.push(newData);
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 201;
                res.end(JSON.stringify({ message: "Health data saved successfully" }));
              });
            } else if (req.url === '/api/health-data' && req.method === 'DELETE') {
              mockHealthData = [];
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ message: "All health data cleared" }));
            } else {
              next();
            }
          });
        }
      }
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
        }
      }
    },
  };
});
