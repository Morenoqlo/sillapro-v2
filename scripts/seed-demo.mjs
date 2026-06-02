#!/usr/bin/env node
/**
 * SillaPro · Demo data seeder
 *
 * Llena una barbería existente con datos realistas para hacer demos:
 *   - 3 barberos (Diego, Andrés, Felipe)
 *   - 6 servicios (Corte clásico, Fade, Corte+Barba, Barba, Corte niño, Diseño)
 *   - 15 clientes con nombres chilenos
 *   - ~12 citas distribuidas entre ayer, hoy, mañana y pasado
 *   - ~30 pagos del último mes para llenar reportes
 *
 * Uso:
 *   node scripts/seed-demo.mjs --slug=norte-fino
 *   node scripts/seed-demo.mjs --shop-id=<uuid>
 *
 * Requisitos:
 *   - SUPABASE_DB_URL configurado en .env
 *   - La barbería ya debe existir (crearla con el onboarding primero)
 *
 * El script es ADITIVO: agrega datos junto a lo que ya existe.
 * Para empezar de cero, borra y vuelve a crear la barbería desde el onboarding.
 */

import pg from 'pg';
import 'dotenv/config';

const args = process.argv.slice(2).reduce((acc, a) => {
  const [k, v] = a.replace(/^--/, '').split('=');
  acc[k] = v ?? true;
  return acc;
}, {});

if (!args.slug && !args['shop-id']) {
  console.error('ERROR: pasá --slug=<slug> o --shop-id=<uuid>');
  process.exit(1);
}

if (!process.env.SUPABASE_DB_URL) {
  console.error('ERROR: SUPABASE_DB_URL no configurada en .env');
  process.exit(1);
}

const BARBERS = [
  { name: 'Diego Soto', chair: 'Silla 1', commission: 45 },
  { name: 'Andrés Pérez', chair: 'Silla 2', commission: 40 },
  { name: 'Felipe Muñoz', chair: 'Silla 3', commission: 40 },
];

const SERVICES = [
  { name: 'Corte clásico', category: 'Corte', minutes: 30, price: 12000, commission: 40 },
  { name: 'Fade', category: 'Corte', minutes: 40, price: 15000, commission: 40 },
  { name: 'Corte + Barba', category: 'Combo', minutes: 50, price: 20000, commission: 45 },
  { name: 'Barba completa', category: 'Barba', minutes: 25, price: 9000, commission: 40 },
  { name: 'Corte niño', category: 'Corte', minutes: 25, price: 10000, commission: 35 },
  { name: 'Diseño con maquinilla', category: 'Diseño', minutes: 45, price: 18000, commission: 45 },
];

const CLIENTS = [
  { name: 'Cristian Rojas', phone: '+56912345678' },
  { name: 'Matías González', phone: '+56923456789' },
  { name: 'Joaquín Vergara', phone: '+56934567890' },
  { name: 'Tomás Bravo', phone: '+56945678901' },
  { name: 'Benjamín Castro', phone: '+56956789012' },
  { name: 'Vicente Olivares', phone: '+56967890123' },
  { name: 'Sebastián Hidalgo', phone: '+56978901234' },
  { name: 'Lucas Pinto', phone: '+56989012345' },
  { name: 'Maximiliano Tapia', phone: '+56990123456' },
  { name: 'Agustín Reyes', phone: '+56911223344' },
  { name: 'Diego Espinoza', phone: '+56922334455' },
  { name: 'Ignacio Carrasco', phone: '+56933445566' },
  { name: 'Felipe Cortés', phone: '+56944556677' },
  { name: 'Esteban Sandoval', phone: '+56955667788' },
  { name: 'Andrés Morales', phone: '+56966778899' },
];

const client = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL });
await client.connect();

try {
  // 1. Find shop
  let shopId = args['shop-id'];
  if (!shopId) {
    const r = await client.query('SELECT id FROM public.barbershops WHERE slug = $1', [args.slug]);
    if (r.rows.length === 0) throw new Error(`No existe una barbería con slug "${args.slug}"`);
    shopId = r.rows[0].id;
  }
  console.log(`✔ Barbería encontrada: ${shopId}`);

  // 2. Insert barbers
  const barberIds = [];
  for (const b of BARBERS) {
    const r = await client.query(
      `INSERT INTO public.barbers (barbershop_id, full_name, chair_label, commission_default, active)
       VALUES ($1, $2, $3, $4, TRUE)
       RETURNING id`,
      [shopId, b.name, b.chair, b.commission],
    );
    barberIds.push(r.rows[0].id);
  }
  console.log(`✔ ${BARBERS.length} barberos insertados`);

  // 3. Insert services
  const serviceIds = [];
  for (const s of SERVICES) {
    try {
      const r = await client.query(
        `INSERT INTO public.services (barbershop_id, name, category, duration_minutes, price_amount, commission_percent, active)
         VALUES ($1, $2, $3, $4, $5, $6, TRUE)
         RETURNING id`,
        [shopId, s.name, s.category, s.minutes, s.price, s.commission],
      );
      serviceIds.push(r.rows[0].id);
    } catch (e) {
      if (e.code === '23505') {
        // Duplicate name — fetch existing
        const r = await client.query(
          'SELECT id FROM public.services WHERE barbershop_id=$1 AND name=$2',
          [shopId, s.name],
        );
        serviceIds.push(r.rows[0].id);
        console.log(`  (servicio "${s.name}" ya existía, lo reutilizo)`);
      } else throw e;
    }
  }
  console.log(`✔ ${SERVICES.length} servicios listos`);

  // 4. Link every barber to every service
  for (const bid of barberIds) {
    for (const sid of serviceIds) {
      await client.query(
        `INSERT INTO public.barber_services (barbershop_id, barber_id, service_id)
         VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING`,
        [shopId, bid, sid],
      );
    }
  }
  console.log(`✔ Servicios asignados a todos los barberos`);

  // 5. Insert clients
  const clientIds = [];
  for (const c of CLIENTS) {
    try {
      const r = await client.query(
        `INSERT INTO public.clients (barbershop_id, full_name, phone, status)
         VALUES ($1, $2, $3, 'active')
         RETURNING id`,
        [shopId, c.name, c.phone],
      );
      clientIds.push(r.rows[0].id);
    } catch (e) {
      if (e.code === '23505') {
        const r = await client.query(
          'SELECT id FROM public.clients WHERE barbershop_id=$1 AND phone=$2',
          [shopId, c.phone],
        );
        clientIds.push(r.rows[0].id);
      } else throw e;
    }
  }
  console.log(`✔ ${CLIENTS.length} clientes listos`);

  // 6. Helper: insert appointment + optionally payment
  async function insertAppt({ daysOffset, hour, minute, barberIdx, clientIdx, serviceIdx, status, withPayment, paymentMethod, tip }) {
    const svc = SERVICES[serviceIdx];
    const sid = serviceIds[serviceIdx];
    const bid = barberIds[barberIdx];
    const cid = clientIds[clientIdx];
    const offsetSign = daysOffset >= 0 ? '+' : '-';
    const absDays = Math.abs(daysOffset);

    // Build Santiago-local datetime, then cast to UTC.
    const startsExpr = `(date_trunc('day', (now() AT TIME ZONE 'America/Santiago')) ${offsetSign} interval '${absDays} day' + interval '${hour} hour' + interval '${minute} minute') AT TIME ZONE 'America/Santiago'`;
    const endsExpr = `${startsExpr} + interval '${svc.minutes} minute'`;

    let apptId;
    try {
      const r = await client.query(
        `INSERT INTO public.appointments
           (barbershop_id, barber_id, client_id, service_id, starts_at, ends_at, status, price_amount, commission_percent)
         VALUES ($1, $2, $3, $4, ${startsExpr}, ${endsExpr}, $5, $6, $7)
         RETURNING id`,
        [shopId, bid, cid, sid, status, svc.price, svc.commission],
      );
      apptId = r.rows[0].id;
    } catch (e) {
      // Overlap exclusion — skip and continue
      if (e.code === '23P01') return null;
      throw e;
    }

    if (withPayment) {
      await client.query(
        `INSERT INTO public.payments (appointment_id, barbershop_id, method, amount, paid_at)
         VALUES ($1, $2, $3, $4, ${startsExpr} + interval '${svc.minutes + 5} minute')`,
        [apptId, shopId, paymentMethod, svc.price + (tip || 0)],
      );
    }
    return apptId;
  }

  // 7. Today's agenda — mix of pending + in_chair + completed
  const todayPlan = [
    { hour: 10, min: 0, barber: 0, client: 0, svc: 0, status: 'completed', pay: true, method: 'cash', tip: 1000 },
    { hour: 10, min: 30, barber: 1, client: 1, svc: 1, status: 'completed', pay: true, method: 'card', tip: 0 },
    { hour: 11, min: 0, barber: 2, client: 2, svc: 2, status: 'in_chair', pay: false },
    { hour: 12, min: 30, barber: 0, client: 3, svc: 3, status: 'confirmed', pay: false },
    { hour: 14, min: 0, barber: 1, client: 4, svc: 0, status: 'confirmed', pay: false },
    { hour: 15, min: 30, barber: 2, client: 5, svc: 5, status: 'pending', pay: false },
    { hour: 17, min: 0, barber: 0, client: 6, svc: 1, status: 'pending', pay: false },
    { hour: 18, min: 30, barber: 1, client: 7, svc: 2, status: 'pending', pay: false },
  ];
  let todayCount = 0;
  for (const p of todayPlan) {
    const id = await insertAppt({
      daysOffset: 0, hour: p.hour, minute: p.min,
      barberIdx: p.barber, clientIdx: p.client, serviceIdx: p.svc,
      status: p.status, withPayment: p.pay, paymentMethod: p.method, tip: p.tip,
    });
    if (id) todayCount++;
  }
  console.log(`✔ ${todayCount} citas creadas para HOY`);

  // 8. Tomorrow + day after — mostly pending/confirmed
  const futurePlan = [
    { offset: 1, hour: 9, min: 30, barber: 0, client: 8, svc: 0, status: 'confirmed' },
    { offset: 1, hour: 11, min: 0, barber: 1, client: 9, svc: 1, status: 'confirmed' },
    { offset: 1, hour: 12, min: 30, barber: 2, client: 10, svc: 2, status: 'pending' },
    { offset: 1, hour: 16, min: 0, barber: 0, client: 11, svc: 3, status: 'pending' },
    { offset: 2, hour: 10, min: 0, barber: 1, client: 12, svc: 0, status: 'confirmed' },
    { offset: 2, hour: 14, min: 30, barber: 2, client: 13, svc: 5, status: 'pending' },
  ];
  let futureCount = 0;
  for (const p of futurePlan) {
    const id = await insertAppt({
      daysOffset: p.offset, hour: p.hour, minute: p.min,
      barberIdx: p.barber, clientIdx: p.client, serviceIdx: p.svc,
      status: p.status, withPayment: false,
    });
    if (id) futureCount++;
  }
  console.log(`✔ ${futureCount} citas futuras (mañana + pasado)`);

  // 9. Historical month — fill last 30 days with completed + payments
  let historicalCount = 0;
  const methods = ['cash', 'cash', 'card', 'card', 'transfer'];
  for (let d = 1; d <= 30; d++) {
    const apptsPerDay = d % 7 === 0 ? 0 : (d % 5 === 0 ? 4 : (d % 3 === 0 ? 2 : 3));
    for (let i = 0; i < apptsPerDay; i++) {
      const hour = 9 + (i * 2 + (d % 3)) % 9;
      const min = (i * 30) % 60;
      const barber = (d + i) % BARBERS.length;
      const cli = (d * 3 + i) % CLIENTS.length;
      const svc = (d + i * 2) % SERVICES.length;
      const method = methods[(d + i) % methods.length];
      const tip = i % 3 === 0 ? 1500 : 0;
      const id = await insertAppt({
        daysOffset: -d, hour, minute: min,
        barberIdx: barber, clientIdx: cli, serviceIdx: svc,
        status: 'completed', withPayment: true, paymentMethod: method, tip,
      });
      if (id) historicalCount++;
    }
  }
  console.log(`✔ ${historicalCount} citas históricas con pagos (últimos 30 días)`);

  console.log('\n🎉 Datos demo cargados correctamente.\n');
  console.log('Próximos pasos:');
  console.log(`  - Entra a /admin/hoy → verás la agenda de hoy con ${todayCount} citas`);
  console.log(`  - Entra a /admin/reportes → verás las gráficas con datos reales`);
  console.log(`  - Comparte /reservar/${args.slug || '<slug>'} → pueden agendar online`);
} catch (e) {
  console.error('\n❌ ERROR:', e.message);
  process.exit(1);
} finally {
  await client.end();
}
