# Sri Srinivasa Health Portal

A comprehensive healthcare management platform built with Next.js 14, featuring patient management, appointment booking, pharmacy operations, and admin dashboards.

## Features

### Patient Dashboard
- Appointment booking and management
- Virtual consultations
- Medical records management
- Prescription tracking
- Pharmacy integration
- Lab results viewer
- Insurance claims
- Symptom checker with AI
- Chat with healthcare providers

### Admin Dashboard
- Real-time analytics and reporting
- Doctor and staff management
- Queue management
- Inventory tracking
- Revenue analytics
- Appointment management
- Report generation
- AI settings configuration

### Pharmacy Management
- Order fulfillment
- Prescription queue management
- Stock alerts
- Subscription dispatch
- Pharmacy analytics

### Additional Features
- Multi-language support (English, Hindi, Telugu)
- Dark/Light theme
- Role-based access control
- Real-time notifications
- Responsive design
- Advanced charting and analytics
- Document upload and management

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, CSS Modules
- **State Management**: Zustand
- **Forms**: React Hook Form with Zod validation
- **UI Components**: Radix UI
- **Charts**: Chart.js & React ChartJS2
- **API**: Axios
- **Database**: Prisma/Drizzle ORM
- **Authentication**: JWT with NextAuth.js

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- PostgreSQL database

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

Visit `http://localhost:3000` in your browser.

## Project Structure

```
src/
├── app/              # Next.js App Router pages
├── components/       # React components
├── hooks/            # Custom React hooks
├── context/          # React context providers
├── lib/              # Utilities, API clients, auth
├── styles/           # Global styles and tokens
├── types/            # TypeScript type definitions
└── middleware.ts     # Route protection
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run type-check` - Check TypeScript types

## Environment Variables

See `.env.local` for all required configuration options.

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## License

MIT License
