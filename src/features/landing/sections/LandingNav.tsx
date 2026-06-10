import { Link } from 'react-router-dom';

export function LandingNav() {
  return (
    <header className="border-b border-gray-100">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="text-xl font-bold text-brand">
          SillaPro
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4">
          <a
            href="#beneficios"
            className="hidden text-sm text-gray-600 hover:text-brand sm:inline"
          >
            Cómo funciona
          </a>
          <a
            href="#precio"
            className="hidden text-sm text-gray-600 hover:text-brand sm:inline"
          >
            Precio
          </a>
          <Link to="/login" className="text-sm text-gray-600 hover:text-brand">
            Iniciar sesión
          </Link>
          <Link
            to="/register"
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand/90"
          >
            Empezar gratis
          </Link>
        </nav>
      </div>
    </header>
  );
}
