# Yield Predictor (React + Vite)

Welcome to the **Yield Predictor** frontend repository. This application provides a modern, premium user interface for AI-driven precision agriculture.

## Latest Features

- **Authentication System**: Integrated secure login/signup toggles built with local storage persistence. 
- **Admin Dashboard**: A dedicated panel for administrators (seeded by default with `admin123@gmail.com`) to manage the platform.
- **User Management**: Admins have full access to view, edit, and remove registered users.
- **Data Review System**: Platform-wide predictive yield data is logged and strictly accessible via the Admin Dashboard for auditing.
- **AI Support Queries**:
  - **User End**: Users can navigate to the "My Queries" tab in their workspace to submit support questions directly to admins.
  - **Admin End**: A robust query management panel allowing admins to view pending support tickets and reply immediately.
- **Premium UI/UX**: Features glassmorphism components, a responsive split-screen authentication view decorated with high-quality farming assets, and reactive sub-menus using `lucide-react`.

## Setup

1. Make sure you have `Node.js` installed.
2. Run `npm install` to download all dependencies.
3. Start the dev server using `npm run dev`.

*Note: Ensure your Python backend (`http://localhost:8000/api/predict`) is running simultaneously to retrieve live predictions.*
