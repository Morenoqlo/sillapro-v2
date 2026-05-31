import { adminClient } from './supabase-admin';

export interface TestUser {
  id: string;
  email: string;
  password: string;
}

/**
 * Creates a confirmed user (skipping email confirmation) using service_role.
 * If onboard=true, also creates barbershop + barber + service + membership.
 */
export async function createTestUser(opts: { onboard?: boolean } = {}): Promise<TestUser> {
  const stamp = Date.now() + Math.floor(Math.random() * 1000);
  const email = `test-${stamp}@test.sillapro.dev`;
  const password = 'TestPass123!';

  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  const user = data.user!;

  if (opts.onboard) {
    const { data: shop, error: shopErr } = await adminClient
      .from('barbershops')
      .insert({ name: `Test Shop ${stamp}` })
      .select()
      .single();
    if (shopErr) throw shopErr;

    const { data: barber, error: barberErr } = await adminClient
      .from('barbers')
      .insert({ barbershop_id: shop.id, full_name: 'Test Barber' })
      .select()
      .single();
    if (barberErr) throw barberErr;

    await adminClient.from('memberships').insert({
      barbershop_id: shop.id,
      user_id: user.id,
      barber_id: barber.id,
      role: 'owner',
    });

    await adminClient.from('services').insert({
      barbershop_id: shop.id,
      name: 'Test Service',
      duration_minutes: 30,
      price_amount: 10000,
      commission_percent: 40,
    });
  }

  return { id: user.id, email, password };
}

/**
 * Cleans up a test user. If they had a barbershop, cascade also removes it.
 */
export async function deleteTestUser(userId: string): Promise<void> {
  const { data: memberships } = await adminClient
    .from('memberships')
    .select('barbershop_id')
    .eq('user_id', userId);
  if (memberships) {
    for (const m of memberships as { barbershop_id: string }[]) {
      await adminClient.from('barbershops').delete().eq('id', m.barbershop_id);
    }
  }
  await adminClient.auth.admin.deleteUser(userId);
}
