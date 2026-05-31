// Tipos permisivos temporales. Para regenerar tipos completos desde el schema:
//
//   Opción 1 (con Docker Desktop): npx supabase gen types typescript --linked > src/types/database.ts
//   Opción 2 (con access token de Supabase):
//     export SUPABASE_ACCESS_TOKEN=sbp_xxxxx
//     npx supabase gen types typescript --project-id wdmepbbnaaljvsrvuudc > src/types/database.ts
//
// Mientras tanto, los tipos son `any`-friendly — typecheck pasa pero no detecta typos de
// nombres de tabla/columna. Es aceptable para Fase 0; regeneramos al empezar Fase 1.

/* eslint-disable @typescript-eslint/no-explicit-any */
export type Database = {
  public: {
    Tables: Record<string, { Row: any; Insert: any; Update: any; Relationships: any[] }>;
    Views: Record<string, { Row: any; Relationships: any[] }>;
    Functions: Record<string, { Args: any; Returns: any }>;
    Enums: Record<string, string>;
    CompositeTypes: Record<string, any>;
  };
};
