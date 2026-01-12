import { BrowserRouter as Router } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from './context/ThemeContext';
import AppRoutes from './AppRoutes';
import ErrorBoundary from './components/ErrorBoundary';
import { NotificationProvider } from './components/NotificationSystem';
import { LoadingProvider } from './context/LoadingContext';

function App() {
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
}

export default App;
