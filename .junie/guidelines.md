# Development Guidelines for CNS Test Application

This document provides essential information for developers working on the CNS Test application.

## Build/Configuration Instructions

### Prerequisites
- Node.js (v16+)
- npm (v7+)

### Setup
1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```
   The application will be available at http://localhost:5173

3. Build for production:
   ```bash
   npm run build
   ```
   This will create a production-ready build in the `dist` directory.

4. Preview the production build:
   ```bash
   npm run preview
   ```

### Configuration
- The base path for the application is configured in `vite.config.js` as `/vite-first/`
- Application settings are managed in `src/config/settings.ts`
- Localization strings are defined in `src/localization/localization.ts`

## Testing Information

### Testing Framework
The project uses Vitest for testing, which is compatible with Vite projects.

### Running Tests
To run all tests:
```bash
npm test
```


## Additional Development Information

### Development Principles
- Functional approach — prefer pure functions, avoid side effects, and compose functions where possible.
- Immutability — do not mutate inputs in place; use copies and spread operators instead of in-place mutations.
- Strong typing — leverage TypeScript’s strict typing (generics, exact types) and avoid `any`.

Additionally:
- Separate computation and presentation: keep complex calculations (e.g., statistics/metrics) in modules like `src/stats/`, and UI rendering in screens/components.

### Project Structure
- `src/components/` - Reusable UI components
- `src/config/` - Application configuration and domain types
- `src/db/` - Database operations using Dexie.js (IndexedDB wrapper)
- `src/localization/` - Internationalization support (EN/UA)
- `src/routing/` - Custom routing implementation
- `src/screens/` - Main application screens
- `src/stats/` - Statistical analysis functionality
- `src/util/` - Utility functions

### Key Technologies
- **TypeScript** - For type safety
- **Vite** - Build tool and development server
- **Dexie.js** - IndexedDB wrapper for client-side storage
- **Chart.js** - For data visualization
- **TailwindCSS** - For styling
- **DaisyUI** - UI component library based on TailwindCSS
- **simple-statistics** - For statistical calculations

### Code Style
- Use TypeScript for all new code
- Follow the existing pattern of class-based components for screens
- Use functional components for smaller, reusable UI elements
- Document complex functions with JSDoc comments
- Use strong typing and avoid `any` types when possible

### Database Operations
The application uses IndexedDB through Dexie.js for client-side storage:
- User profiles are stored in the `users` table
- Test results are stored in the `tests` table
- See `src/db/db.ts` for the database schema
- Use the functions in `src/db/operations.ts` for database operations

### Adding New Features
1. For new UI components, create a new file in the `src/components/` directory
2. For new screens, create a new file in the `src/screens/` directory and register the route in `src/main.ts`
3. For new test types, update the domain types in `src/config/domain.ts` and add the necessary UI in the appropriate screen files