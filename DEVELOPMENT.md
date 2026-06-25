# Health Portal Development Guide

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment**
   ```bash
   cp .env.local .env.local.backup
   # Edit .env.local with your configuration
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Access the application**
   - Open http://localhost:3000 in your browser
   - Landing page available at /landing
   - Admin dashboard at /admin/dashboard
   - Patient dashboard at /patient/dashboard
   - Pharmacy dashboard at /pharmacy/dashboard

## Project Structure

- **src/app**: Next.js 14 App Router pages and layouts
- **src/components**: Reusable React components
- **src/hooks**: Custom React hooks for state management
- **src/context**: React Context for global state
- **src/lib**: Utilities, API clients, and configurations
- **src/styles**: Global styles and theme tokens
- **src/types**: TypeScript type definitions
- **public**: Static assets and media

## Key Features Implemented

### Authentication
- Login/Register pages
- OTP verification
- Biometric authentication prompts

### Patient Features
- Dashboard with quick actions
- Appointment booking
- Medical records management
- Prescription tracking
- Pharmacy integration
- Lab results viewer
- Insurance claim management

### Admin Features
- Analytics dashboard
- Doctor management
- Queue management
- Inventory tracking
- Staff management
- Report generation

### Pharmacy Features
- Order management
- Inventory tracking
- Prescription queue
- Stock alerts

## API Integration

API clients are located in `src/lib/api/`:
- `auth.ts` - Authentication endpoints
- `appointments.ts` - Appointment management
- `inventory.ts` - Inventory operations
- `prescriptions.ts` - Prescription management

## Components

### UI Components
Located in `src/components/ui/`:
- Button, Card, Input, Badge
- Toast, Modal, Tabs, Avatar
- Skeleton, Dropdown

### Layout Components
- Header with notifications
- Sidebar navigation
- Footer

### Feature Components
- Role-based access control
- Data tables
- Empty states
- Loaders
- Search bars

## Styling

- **Framework**: Tailwind CSS
- **Theme**: CSS custom properties
- **Dark Mode**: Supported
- **Animations**: CSS transitions

## Internationalization

Languages supported:
- English (en)
- Hindi (hi)
- Telugu (te)

Translation files in `src/lib/i18n/`

## State Management

- **Auth**: AuthContext
- **Language**: LanguageContext
- **Theme**: ThemeContext
- **Toasts**: ToastContext
- **Data Fetching**: Custom hooks with Axios

## Testing

Run ESLint:
```bash
npm run lint
```

Format code:
```bash
npm run format
```

Type checking:
```bash
npm run type-check
```

## Deployment

Build for production:
```bash
npm run build
npm run start
```

## Environment Variables

Required variables in `.env.local`:
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `DATABASE_URL` - Database connection string
- `JWT_SECRET` - JWT signing secret
- Third-party API keys (Stripe, SendGrid, OpenAI, etc.)

## Troubleshooting

- **Port 3000 already in use**: Change port with `npm run dev -- -p 3001`
- **Module not found**: Run `npm install` again
- **Build errors**: Clear `.next` directory and rebuild

## Contributing

1. Create a feature branch
2. Follow the existing code structure
3. Use TypeScript for type safety
4. Run linting before committing

## Support

For issues or questions, please refer to the documentation or contact the development team.
