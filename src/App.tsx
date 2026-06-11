import { HelmetProvider } from 'react-helmet-async';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import AppRoutes from './AppRoutes';
import ErrorBoundary from './components/ErrorBoundary';
import { NotificationProvider } from './components/NotificationSystem';
import { LoadingProvider } from './context/LoadingContext';
import { ThemeProvider } from './context/ThemeContext';

// Load debug utilities in development
if (import.meta.env.DEV) {
  import('./utils/debug');
}

// Data router hosting the declarative <Routes> tree in a single splat route.
// useBlocker (GameScreen's leave-game guard) requires a data router and
// throws inside plain <BrowserRouter>.
const router = createBrowserRouter([
  {
    path: '*',
    element: (
      <ErrorBoundary>
        <NotificationProvider>
          <LoadingProvider>
            <AppRoutes />
          </LoadingProvider>
        </NotificationProvider>
      </ErrorBoundary>
    ),
  },
]);

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <HelmetProvider>
        <RouterProvider router={router} />
      </HelmetProvider>
    </ThemeProvider>
  );
};

export default App;
