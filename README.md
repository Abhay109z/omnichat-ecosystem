# OmniChat Ecosystem

A modern, full-stack chat application with AI-powered responses.

## Features
- User authentication (login/signup)
- Real-time streaming AI responses
- Admin dashboard with analytics
- Dark/Light mode toggle
- Image upload support in chat
- Chat history persistence

## Tech Stack
### Backend
- Go
- Chi router
- MongoDB
- Groq API (for AI)

### Frontend
- React 19
- Redux Toolkit
- Zustand
- Tailwind CSS

## Getting Started

### Prerequisites
- Node.js & npm
- Go
- MongoDB

### Installation
#### Backend
```bash
cd backend
go mod tidy
go run main.go
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Environment Variables
Add your own Groq API key in backend/.env
