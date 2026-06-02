# Email Templates · SillaPro

Plantillas en español para los correos transaccionales que Supabase Auth manda.
Cuando configures Resend (o cualquier SMTP propio) en
**Supabase Dashboard → Auth → Email Templates**, pega el HTML de cada archivo en
la plantilla correspondiente.

## Mapeo

| Archivo                   | Supabase template               | Cuándo se envía                                  |
|---------------------------|---------------------------------|--------------------------------------------------|
| `confirm-signup.html`     | Confirm signup                  | Al registrarse, antes de poder entrar            |
| `magic-link.html`         | Magic Link                      | Cuando piden login por link en `/magic-link`     |
| `reset-password.html`     | Reset Password                  | Cuando piden recuperar contraseña                |
| `change-email.html`       | Change Email Address            | Cuando cambian su correo en Ajustes              |
| `invite-user.html`        | Invite User                     | (Reservado — no se usa todavía)                  |

## Variables que Supabase reemplaza automáticamente

- `{{ .ConfirmationURL }}` — URL completa para confirmar/aceptar la acción
- `{{ .Token }}` — código OTP de 6 dígitos (alternativa al link)
- `{{ .TokenHash }}` — hash del token (no usar directamente)
- `{{ .SiteURL }}` — la URL de tu sitio (ej: `https://sillapro-v2.vercel.app`)
- `{{ .Email }}` — correo del destinatario
- `{{ .Data }}` — campos custom enviados desde el frontend

## Cómo usar

1. Configura tu SMTP en Supabase (ver `docs/superpowers/notes/resend-setup.md`)
2. Ve a **Authentication → Email Templates**
3. Para cada plantilla:
   - Cambia el **Subject** al sugerido al principio de cada `.html`
   - Pega el contenido **completo** del `.html` en el campo de mensaje
4. Save

## Sender configuration

En **Authentication → SMTP Settings** asegúrate que el sender sea:

- **Sender email:** `hola@sillapro.cl` (o el que verifiques en Resend)
- **Sender name:** `SillaPro`

Si todavía no tienes dominio propio, usa el sandbox de Resend
(`onboarding@resend.dev`) — solo manda a tu correo verificado pero sirve para
probar.
