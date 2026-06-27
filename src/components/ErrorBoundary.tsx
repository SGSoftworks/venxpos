import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-full bg-slate-50 flex flex-col items-center justify-center text-gray-900 p-8">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-6">
            <span className="text-red-600 text-3xl font-bold">!</span>
          </div>
          <h1 className="text-2xl font-bold mb-4 text-gray-900">Error de Aplicación</h1>
          <p className="text-gray-500 mb-6 text-center max-w-md">
            VenxPos encontró un error inesperado. Por favor reinicie la aplicación.
          </p>
          <pre className="bg-white border border-gray-200 p-4 rounded-lg text-xs text-red-600 max-w-lg overflow-auto mb-6 shadow-sm">
            {this.state.error?.message}
          </pre>
          <button
            onClick={this.handleReset}
            className="px-6 py-3 bg-[var(--color-primary)] text-white font-semibold rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors"
          >
            Reintentar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
