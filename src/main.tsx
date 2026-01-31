import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import '@xyflow/react/dist/style.css';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './context/AuthContext';
import { Provider } from 'react-redux';
import { store } from './store';
import { ThemeProvider } from './components/theme/ThemeProvider';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <Provider store={store}>
          <ThemeProvider>
            <App />
          </ThemeProvider>
        </Provider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
