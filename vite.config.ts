import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    // Use VITE_BASE_URL env var if set (from build script), otherwise default to root
    base: process.env.VITE_BASE_URL || '/',

    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      {
        name: 'save-config',
        configureServer(server) {
          server.middlewares.use('/api/save-config', (req, res, next) => {
            if (req.method === 'POST') {
              let body = '';
              req.on('data', chunk => {
                body += chunk.toString();
              });
              req.on('end', () => {
                try {
                  const configPath = path.resolve(process.cwd(), 'data/config.json');
                  // Validate JSON before writing
                  JSON.parse(body);
                  fs.writeFileSync(configPath, body);
                  res.statusCode = 200;
                  res.end(JSON.stringify({ success: true }));
                } catch (error) {
                  console.error('Error saving config:', error);
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: 'Failed to save config' }));
                }
              });
            } else {
              next();
            }
          });

          server.middlewares.use('/api/save-users', (req, res, next) => {
            if (req.method === 'POST') {
              let body = '';
              req.on('data', chunk => {
                body += chunk.toString();
              });
              req.on('end', () => {
                try {
                  const usersPath = path.resolve(process.cwd(), 'data/users.json');
                  // Validate JSON before writing
                  JSON.parse(body);
                  fs.writeFileSync(usersPath, body);
                  res.statusCode = 200;
                  res.end(JSON.stringify({ success: true }));
                } catch (error) {
                  console.error('Error saving users:', error);
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: 'Failed to save users' }));
                }
              });
            } else {
              next();
            }
          });

          server.middlewares.use('/api/save-plays', (req, res, next) => {
            if (req.method === 'POST') {
              let body = '';
              req.on('data', chunk => {
                body += chunk.toString();
              });
              req.on('end', () => {
                try {
                  const playsPath = path.resolve(process.cwd(), 'data/giocate.json');
                  // Validate JSON before writing
                  JSON.parse(body);
                  fs.writeFileSync(playsPath, body);
                  res.statusCode = 200;
                  res.end(JSON.stringify({ success: true }));
                } catch (error) {
                  console.error('Error saving plays:', error);
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: 'Failed to save plays' }));
                }
              });
            } else {
              next();
            }
          });

          server.middlewares.use('/api/save-requests', (req, res, next) => {
            if (req.method === 'POST') {
              let body = '';
              req.on('data', chunk => {
                body += chunk.toString();
              });
              req.on('end', () => {
                try {
                  const requestsPath = path.resolve(process.cwd(), 'data/richieste.json');
                  // Validate JSON before writing
                  JSON.parse(body);
                  fs.writeFileSync(requestsPath, body);
                  res.statusCode = 200;
                  res.end(JSON.stringify({ success: true }));
                } catch (error) {
                  console.error('Error saving requests:', error);
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: 'Failed to save requests' }));
                }
              });
            } else {
              next();
            }
          });
        }
      }
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), '.'),
      }
    }
  };
});
