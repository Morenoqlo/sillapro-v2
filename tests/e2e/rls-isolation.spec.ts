import { test, expect } from '@playwright/test';
import { adminClient, anonClientForUser } from './helpers/supabase-admin';

test.describe('RLS multi-tenant isolation', () => {
  const fixtures: {
    shopAId?: string;
    shopBId?: string;
    userAEmail?: string;
    userBEmail?: string;
    userAId?: string;
    userBId?: string;
    clientAId?: string;
    clientBId?: string;
  } = {};

  test.beforeAll(async () => {
    const stamp = Date.now();
    fixtures.userAEmail = `user-a-${stamp}@test.sillapro.dev`;
    fixtures.userBEmail = `user-b-${stamp}@test.sillapro.dev`;

    // Crear usuario A
    const { data: userA, error: errA } = await adminClient.auth.admin.createUser({
      email: fixtures.userAEmail,
      password: 'TestPass123!',
      email_confirm: true,
    });
    if (errA) throw errA;
    fixtures.userAId = userA.user!.id;

    // Crear usuario B
    const { data: userB, error: errB } = await adminClient.auth.admin.createUser({
      email: fixtures.userBEmail,
      password: 'TestPass123!',
      email_confirm: true,
    });
    if (errB) throw errB;
    fixtures.userBId = userB.user!.id;

    // Crear barbería A
    const { data: shopA, error: shopAErr } = await adminClient
      .from('barbershops')
      .insert({ name: `Test Shop A ${stamp}` })
      .select()
      .single();
    if (shopAErr) throw shopAErr;
    fixtures.shopAId = shopA.id;

    await adminClient.from('memberships').insert({
      barbershop_id: shopA.id,
      user_id: fixtures.userAId,
      role: 'owner',
    });

    // Crear barbería B
    const { data: shopB, error: shopBErr } = await adminClient
      .from('barbershops')
      .insert({ name: `Test Shop B ${stamp}` })
      .select()
      .single();
    if (shopBErr) throw shopBErr;
    fixtures.shopBId = shopB.id;

    await adminClient.from('memberships').insert({
      barbershop_id: shopB.id,
      user_id: fixtures.userBId,
      role: 'owner',
    });

    // Crear cliente en shop A
    const { data: cA } = await adminClient
      .from('clients')
      .insert({ barbershop_id: shopA.id, full_name: 'Cliente A1', phone: '+56 9 1111 1111' })
      .select()
      .single();
    fixtures.clientAId = cA!.id;

    // Crear cliente en shop B
    const { data: cB } = await adminClient
      .from('clients')
      .insert({ barbershop_id: shopB.id, full_name: 'Cliente B1', phone: '+56 9 2222 2222' })
      .select()
      .single();
    fixtures.clientBId = cB!.id;
  });

  test.afterAll(async () => {
    if (fixtures.shopAId) await adminClient.from('barbershops').delete().eq('id', fixtures.shopAId);
    if (fixtures.shopBId) await adminClient.from('barbershops').delete().eq('id', fixtures.shopBId);
    if (fixtures.userAId) await adminClient.auth.admin.deleteUser(fixtures.userAId);
    if (fixtures.userBId) await adminClient.auth.admin.deleteUser(fixtures.userBId);
  });

  test('user A only sees their own shop and clients', async () => {
    const client = anonClientForUser();
    await client.auth.signInWithPassword({
      email: fixtures.userAEmail!,
      password: 'TestPass123!',
    });

    const { data: shops } = await client.from('barbershops').select('id, name');
    expect(shops).toHaveLength(1);
    expect(shops![0]!.id).toBe(fixtures.shopAId);

    const { data: clients } = await client.from('clients').select('id, full_name');
    expect(clients).toHaveLength(1);
    expect(clients![0]!.full_name).toBe('Cliente A1');
  });

  test('user A cannot insert into shop B (RLS rejects)', async () => {
    const client = anonClientForUser();
    await client.auth.signInWithPassword({
      email: fixtures.userAEmail!,
      password: 'TestPass123!',
    });

    const { error } = await client.from('clients').insert({
      barbershop_id: fixtures.shopBId!,
      full_name: 'Intruso',
    });

    expect(error).not.toBeNull();
    // Verificar via admin que NO se creó el registro
    const { data: bClients } = await adminClient
      .from('clients')
      .select('full_name')
      .eq('barbershop_id', fixtures.shopBId!);
    expect(bClients!.find((c: { full_name: string }) => c.full_name === 'Intruso')).toBeUndefined();
  });

  test('unauthenticated user sees nothing', async () => {
    const client = anonClientForUser();
    // sin signIn

    const { data: shops } = await client.from('barbershops').select('id');
    expect(shops).toHaveLength(0);

    const { data: clients } = await client.from('clients').select('id');
    expect(clients).toHaveLength(0);
  });
});
