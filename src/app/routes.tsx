import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout } from './layouts/AdminLayout';
import { BarberLayout } from './layouts/BarberLayout';

function Placeholder({ title }: { title: string }) {
  return (
    <div>
      <h2 className="text-2xl font-bold">{title}</h2>
      <p className="mt-1 text-gray-500">Pantalla pendiente — Fase 1.</p>
    </div>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Placeholder title="Login" />} />

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="hoy" replace />} />
        <Route path="hoy" element={<Placeholder title="Hoy" />} />
        <Route path="agenda" element={<Placeholder title="Agenda" />} />
        <Route path="clientes" element={<Placeholder title="Clientes" />} />
        <Route path="caja" element={<Placeholder title="Caja" />} />
        <Route path="reportes" element={<Placeholder title="Reportes" />} />
        <Route path="servicios" element={<Placeholder title="Servicios" />} />
        <Route path="equipo" element={<Placeholder title="Equipo" />} />
        <Route path="ajustes" element={<Placeholder title="Ajustes" />} />
      </Route>

      <Route path="/barbero" element={<BarberLayout />}>
        <Route index element={<Navigate to="mi-dia" replace />} />
        <Route path="mi-dia" element={<Placeholder title="Mi día" />} />
        <Route path="comisiones" element={<Placeholder title="Comisiones" />} />
        <Route path="historial" element={<Placeholder title="Historial" />} />
      </Route>

      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
