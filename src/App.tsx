import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './AppRoutes';
import ErrorBoundary from './components/ErrorBoundary';
import { NotificationProvider } from './components/NotificationSystem';
import { LoadingProvider } from './context/LoadingContext';
import { ThemeProvider } from './context/ThemeContext';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <HelmetProvider>
        <Router>
          <ErrorBoundary>
            <NotificationProvider>
              <LoadingProvider>
                <AppRoutes />
              </LoadingProvider>
            </NotificationProvider>
          </ErrorBoundary>
        </Router>
      </HelmetProvider>
    </ThemeProvider>
  );
};

export default App;
