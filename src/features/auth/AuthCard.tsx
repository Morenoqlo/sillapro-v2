import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <Link to="/" className="text-2xl font-bold text-brand">
            SillaPro
          </Link>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="mb-4 mt-1 text-sm text-gray-600">{subtitle}</p>}
          <div className="mt-4">{children}</div>
        </div>
        {footer && <div className="mt-4 text-center text-sm text-gray-600">{footer}</div>}
      </div>
    </div>
  );
}
