# AI Concierge Chatbot Project

A bilingual (English/Bisaya) chatbot interface with map integration and voice support. This project is a React frontend mockup designed for easy integration with a backend (Node.js/Express) and an AI service (Rasa).

## Features

- **Interactive Chat Widget**: Floating chat bubble with expanded window.
- **Voice Input**: Speech-to-text integration using Web Speech API.
- **Map Integration**: Leaflet maps rendered directly in chat for navigation queries.
- **Admin Dashboard**: Manage intents, responses, and map locations.
- **Bilingual Support**: Designed for English and Bisaya interactions.

## Project Structure

- **Frontend**: React, Vite, Tailwind CSS, Shadcn UI
- **Routing**: Wouter
- **Maps**: Leaflet / React-Leaflet
- **State/Mock API**: `client/src/lib/mockApi.ts` (Simulates backend responses)

## Getting Started

### Prerequisites

- Node.js (v20 or higher recommended)
- npm or yarn

### Installation

1.  Clone this repository or extract the project files.
2.  Install dependencies:
    ```bash
    npm install
    ```

### Running Locally (Development)

Start the development server:

```bash
npm run dev
```

- The app will be available at `http://localhost:5000`
- The admin dashboard is at `http://localhost:5000/admin`

### Building for Production

To create a production build:

```bash
npm run build
```

This will generate a `dist` folder containing:
- `dist/public`: The compiled static frontend assets.
- `dist/index.cjs`: The server entry point (if using the provided Express setup).

To run the production build:

```bash
npm start
```

## Customization

- **Bot Responses**: Edit `client/src/lib/mockApi.ts` to change the initial data or connect to a real backend.
- **Maps**: Replace the placeholder map image in `client/src/components/chat/MapMessage.tsx` with your own floor plans.
- **Styling**: Modify `client/src/index.css` for theme colors and `tailwind.config.ts` (if present) or `vite.config.ts` for Tailwind configuration.

## Backend Integration

This project is currently in **Mockup Mode**. To connect to a real backend:
1.  Replace `mockApi.ts` calls with `fetch()` requests to your API.
2.  Implement the API endpoints specified in the original requirements (e.g., `/api/send_message`).
