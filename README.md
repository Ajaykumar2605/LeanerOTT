# LeanerOTT

## Overview

LeanerOTT is an OTT‑style learning library web application. It provides a glossy, modern UI for browsing, previewing, and downloading educational content. The front‑end is built with plain HTML, CSS, and JavaScript, styled with glassmorphism, gradients and subtle animations. The back‑end (optional) runs on Node.js/Express and serves files via a REST API.

## Features

- Beautiful responsive UI with dark/light theme
- File preview for PDFs, images, videos, and text
- Secure login with JWT
- Upload support via Multer
- API endpoints for content management

## Quick Start

```bash
git clone https://github.com/Ajaykumar2605/LeanerOTT.git
cd LeanerOTT
npm install
npm run dev   # or npm start
```

## Deployment

The static front‑end can be hosted on GitHub Pages. After pushing to `main`, enable Pages → Source: `main / (root)`. The site will be available at `https://ajaykumar2605.github.io/LeanerOTT/`.  
For the backend, deploy to Render, Railway, Fly.io, etc., and update the frontend API base URL.

## License

MIT
