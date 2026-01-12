import React from 'react';
import PropTypes from 'prop-types';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-6">
          <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8 text-center border border-slate-200 dark:border-slate-700">
            <div className="text-6xl mb-6">😵</div>
            <h2 className="text-2xl font-black mb-2 text-slate-800 dark:text-white">
              Something went wrong
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8">
              We encountered an unexpected error. Please try reloading the app.
            </p>
            <button
              onClick={this.handleReload}
              className="w-full py-4 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold shadow-lg shadow-sky-500/20 transition-all"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ErrorBoundary;
