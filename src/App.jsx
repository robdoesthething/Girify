import { BrowserRouter as Router } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from './context/ThemeContext';
import AppRoutes from './AppRoutes';

function App() {
  return (
    <ThemeProvider>
      <HelmetProvider>
        <Router>
          <AppRoutes />
        </Router>
      </HelmetProvider>
    </ThemeProvider>
  );
}

export default App;
