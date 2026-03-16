# 🏥 CareLink Technical Troubleshooting & Change Report

This document outlines the technical challenges encountered during the deployment of CareLink and the architectural decisions made to resolve them.

## 1. Issue: Serverless Body Loss (The "Input Length: 0" Bug)
### Symptoms
- Login requests failing with 400 Bad Request.
- Server logs showing empty request bodies or bodies parsed as indexed objects (e.g., `{ "0": "{", "1": "e" ... }`).
- In extreme cases, data was being misinterpreted as large scientific notation numbers.

### Root Cause
Netlify Functions (AWS Lambda) handles incoming HTTP requests by fragmenting large or specific JSON payloads. Standard Express middleware (`express.json()`) often fails to reconstruct these fragments correctly in a serverless environment.

### Solution: Ultra-Robust Body Parser
We implemented a custom **Body Recovery Middleware** in `app.js` that:
1. Detects indexed byte arrays or character objects.
2. Reconstructs them using `Buffer` for byte reliability.
3. Provides a fallback to the raw API Gateway event (`req.apiGateway.event.body`) if the primary parser fails.
4. Handles Base64 encoded payloads automatically.

## 2. Issue: Database Connectivity (IPv6 vs IPv4)
### Symptoms
- `ENOTFOUND` or `ETIMEDOUT` when connecting to Supabase from certain local or CI environments.

### Solution
Switched connection geometry to use **Supabase Transaction Pooler (Port 6543)**. This ensures compatibility with IPv4-only networks and optimizes connection counts for serverless functions.

## 3. Major Feature Implementation: MyPage (Dashboard)
During the development phase, the MyPage was extensively refactored to provide a premium, data-driven experience.

### Key Enhancements
- **Dynamic Grid Layout**: Fixed the layout issue to ensure a responsive 2x2 grid (AI Comments > Health Score/Report > Trend Chart > Action Plan).
- **Multi-Year Data Support**: Implemented logic to fetch available exam years (`/reports/years`) and automatically load the most recent record.
- **AI-Driven Summaries**: Integrated a dedicated section at the top of the dashboard for AI-generated health comments, using `framer-motion` for smooth entry animations.
- **Visual Feedback**: Added `Loader2` spin animations and transition effects to improve the perceived performance during AI data analysis.

## 4. Deployment & Build Summary
- **Successful Build Version**: `f2ff37d` (and subsequent cleanup commits).
- **Key Files Modified**:
    - `backend/src/app.js`: Implementation of the body recovery logic.
    - `backend/src/config/db.js`: Optimization for PostgreSQL/Supabase.
    - `frontend/src/api/axios.js`: Explicit `Content-Type` and dynamic base URL detection.
    - `frontend/src/pages/MyPage.jsx`: Grid layout and API integration logic.
    - `backend/src/services/geminiService.js`: Buffer-based image handling for serverless.

## 5. Collaborative Impact
- **Developer Experience**: Team members can now deploy seamlessly without worrying about infrastructure-specific body parsing bugs.
- **Portability**: The code is now cloud-agnostic, working equally well on local Express servers and Netlify/AWS Lambda.
- **Portfolio Value**: The project demonstrates deep expertise in handling serverless edge cases and complex frontend state management.

---
*Prepared for the CareLink Development Team Portfolio*
