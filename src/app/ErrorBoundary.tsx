import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Top-level error boundary. Catches uncaught render errors and shows a
 * graceful fallback instead of a blank screen. Logs the stack to console
 * for now — when Sentry/Rollbar is wired up, push there too.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // When Sentry/Rollbar is wired, push there. For now write to console
    // so devs can see the stack when reproducing locally.
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReload = (): void => {
    this.setState({ error: null });
    window.location.assign('/admin/hoy');
  };

  override render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
          <div className="w-full max-w-md text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl">
              ⚠️
            </div>
            <h1 className="text-xl font-bold text-gray-900">Algo salió mal</h1>
            <p className="mt-2 text-sm text-gray-600">
              Ocurrió un error inesperado. Si vuelve a pasar, escríbenos.
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="mt-6 rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand/90"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
