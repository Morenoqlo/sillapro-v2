import { ErrorBoundary } from './ErrorBoundary';
import { Providers } from './providers';
import { AppRoutes } from './routes';

export default function App() {
  return (
    <ErrorBoundary>
      <Providers>
        <AppRoutes />
      </Providers>
    </ErrorBoundary>
  );
}
