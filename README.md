# Omepilot Auto AI

Omepilot Auto AI is a robust, AI-powered productivity and chat application designed to streamline workflows and enhance creativity. Built with a modern tech stack utilizing React, Supabase, and Shadcn UI, it offers a seamless blend of real-time communication, content generation, and community features.

## � Features

### Core Capabilities
-   **🤖 AI Chat Interface**: Advanced chat functionality with persona support and context-aware interactions.
-   **⚡ Real-time Collaboration**: Live messaging, notifications, and updates powered by Supabase Realtime.
-   **🔐 Secure Authentication**: Full user authentication system with protected routes and profile management.

### Creative & Productivity Tools
-   **🎨 Image Generation**: Create images on the fly using AI.
-   **📝 Document & Code Generation**: Automated tools for generating code snippets and full documents.
-   **🧠 Memory & Context**: Persistent memory management for smarter AI interactions.
-   **❓ Quiz Generator**: Auto-generate quizzes for learning and testing.
-   **🗣️ Voice & Audio**: Integrated Text-to-Speech (ElevenLabs) and Voice Transcription services.

### Community & Growth
-   **🏆 Leaderboard**: Gamified user engagement and tracking.
-   **🌍 Discovery Feed**: Explore content and creators in the community.
-   **👨‍🎨 Creator Gallery**: Showcase of user-generated content and profiles.

## 🛠️ Tech Stack

### Frontend
-   **Framework**: [React](https://react.dev/) + [Vite](https://vitejs.dev/)
-   **Language**: TypeScript
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **UI Library**: [shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/)
-   **State Management**: [TanStack Query](https://tanstack.com/query/latest)
-   **Animations**: Framer Motion

### Backend & Infrastructure
-   **Platform**: [Supabase](https://supabase.com/)
-   **Database**: PostgreSQL
-   **Serverless Logic**: Supabase Edge Functions (Deno)
-   **Authentication**: Supabase Auth
-   **Storage**: Supabase Storage

## 📂 Project Structure

This project follows a clear separation of concerns between the frontend client and the backend services.

```
/
├── src/                        # Frontend Source Code
│   ├── components/             # Reusable UI Components
│   │   ├── ui/                 # Shadcn UI primitives (Button, Card, etc.)
│   │   └── ...                 # Feature-specific components (ChatInterface, Sidebar)
│   ├── pages/                  # Main Application Views (Routes)
│   │   ├── Chat.tsx            # Main Chat Interface
│   │   ├── DashboardPage.tsx   # User Dashboard
│   │   └── ...
│   ├── hooks/                  # Custom React Hooks
│   │   ├── useRealtime.ts      # Supabase Realtime logic
│   │   ├── useTTS.ts           # Text-to-Speech logic
│   │   └── ...
│   ├── contexts/               # React Context Providers (Auth, Theme)
│   ├── integrations/           # Third-party integrations (Supabase client)
│   ├── App.tsx                 # Main Application Component & Routing
│   └── main.tsx                # Application Entry Point
│
├── supabase/                   # Backend Configuration
│   ├── functions/              # Edge Functions (Serverless Backend Logic)
│   │   ├── chat/               # Chat processing logic
│   │   ├── generate-image/     # Image generation handler
│   │   ├── voice-transcribe/   # Audio transcription handler
│   │   └── ...
│   ├── migrations/             # Database Schema Definitions (.sql files)
│   └── config.toml             # Local Supabase Configuration
│
└── public/                     # Static Assets
```

## 🏁 Getting Started

### Prerequisites
-   Node.js (v18 or higher)
-   npm, pnpm, or bun

### Installation

1.  **Clone the repository**
    ```sh
    git clone <YOUR_REPO_URL>
    cd omepilot-auto-ai
    ```

2.  **Install Dependencies**
    ```sh
    npm install
    ```

3.  **Environment Setup**
    Create a `.env` file in the root directory. You can use the example below as a reference:
    ```env
    VITE_SUPABASE_PROJECT_ID="your_project_id"
    VITE_SUPABASE_PUBLISHABLE_KEY="your_publishable_key"
    VITE_SUPABASE_URL="https://your-project.supabase.co"
    OPENAI_API_KEY="your_openai_api_key"
    ```

4.  **Run the Development Server**
    ```sh
    npm run dev
    ```
    The application will be available at `http://localhost:8080` (or the port shown in your terminal).

## 🗄️ Database & Backend

### Database Schema
The database schema is managed via **Supabase Migrations** located in `supabase/migrations/`. These SQL files represent the source of truth for your database structure, including:
-   Tables (Profiles, Messages, etc.)
-   RLS (Row Level Security) Policies
-   Database Functions and Triggers

### Edge Functions
Backend logic is handled by Supabase Edge Functions found in `supabase/functions/`. These handle secure operations such as:
-   Interacting with AI APIs (OpenAI, Anthropic)
-   Processing payment or complex business logic
-   Handling webhooks

To deploy functions (requires Supabase CLI):
```sh
supabase functions deploy <function_name>
```

## 📜 Scripts

-   `npm run dev`: Start development server
-   `npm run build`: Build for production
-   `npm run lint`: Run ESLint analysis
-   `npm run preview`: Preview production build locally

## 📄 License

This project is private and proprietary.
