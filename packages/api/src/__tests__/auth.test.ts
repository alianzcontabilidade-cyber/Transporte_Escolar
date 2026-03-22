import { describe, it, expect } from 'vitest';
import { hash, compare } from 'bcryptjs';
import { sign, verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-vitest';

describe('Auth - Hashing de senha', () => {
  it('deve gerar hash diferente da senha original', async () => {
    const password = 'minhaSenha123';
    const hashed = await hash(password, 12);
    expect(hashed).not.toBe(password);
    expect(hashed.length).toBeGreaterThan(50);
  });

  it('deve verificar senha correta', async () => {
    const password = 'senhaForte@2024';
    const hashed = await hash(password, 12);
    const match = await compare(password, hashed);
    expect(match).toBe(true);
  });

  it('deve rejeitar senha incorreta', async () => {
    const password = 'senhaCorreta';
    const hashed = await hash(password, 12);
    const match = await compare('senhaErrada', hashed);
    expect(match).toBe(false);
  });

  it('deve gerar hashes diferentes para mesma senha', async () => {
    const password = 'mesmaSenha';
    const hash1 = await hash(password, 12);
    const hash2 = await hash(password, 12);
    expect(hash1).not.toBe(hash2); // salt diferente
    // Mas ambos devem verificar a mesma senha
    expect(await compare(password, hash1)).toBe(true);
    expect(await compare(password, hash2)).toBe(true);
  });
});

describe('Auth - JWT Token', () => {
  it('deve gerar token válido', () => {
    const payload = { userId: 1, municipalityId: 1, role: 'municipal_admin' };
    const token = sign(payload, JWT_SECRET, { expiresIn: '7d' });
    expect(token).toBeDefined();
    expect(token.split('.').length).toBe(3); // header.payload.signature
  });

  it('deve decodificar token com dados corretos', () => {
    const payload = { userId: 42, municipalityId: 5, role: 'secretary' };
    const token = sign(payload, JWT_SECRET, { expiresIn: '7d' });
    const decoded = verify(token, JWT_SECRET) as any;
    expect(decoded.userId).toBe(42);
    expect(decoded.municipalityId).toBe(5);
    expect(decoded.role).toBe('secretary');
  });

  it('deve rejeitar token com secret errado', () => {
    const token = sign({ userId: 1 }, JWT_SECRET);
    expect(() => verify(token, 'chave-errada')).toThrow();
  });

  it('deve rejeitar token expirado', () => {
    const token = sign({ userId: 1 }, JWT_SECRET, { expiresIn: '0s' });
    // Token expira imediatamente
    expect(() => verify(token, JWT_SECRET)).toThrow();
  });

  it('deve rejeitar token malformado', () => {
    expect(() => verify('token.invalido', JWT_SECRET)).toThrow();
    expect(() => verify('', JWT_SECRET)).toThrow();
  });
});

describe('Auth - Roles e permissões', () => {
  const adminRoles = ['super_admin', 'municipal_admin', 'secretary'];
  const staffRoles = ['super_admin', 'municipal_admin', 'secretary', 'driver', 'monitor'];
  const academicRoles = ['super_admin', 'municipal_admin', 'secretary', 'school_admin', 'teacher', 'coordinator'];

  it('deve identificar roles de admin', () => {
    expect(adminRoles.includes('super_admin')).toBe(true);
    expect(adminRoles.includes('municipal_admin')).toBe(true);
    expect(adminRoles.includes('secretary')).toBe(true);
    expect(adminRoles.includes('driver')).toBe(false);
    expect(adminRoles.includes('parent')).toBe(false);
  });

  it('deve identificar roles de staff', () => {
    expect(staffRoles.includes('driver')).toBe(true);
    expect(staffRoles.includes('monitor')).toBe(true);
    expect(staffRoles.includes('parent')).toBe(false);
  });

  it('deve identificar roles acadêmicos', () => {
    expect(academicRoles.includes('teacher')).toBe(true);
    expect(academicRoles.includes('coordinator')).toBe(true);
    expect(academicRoles.includes('driver')).toBe(false);
  });

  it('super_admin deve ter acesso a tudo', () => {
    expect(adminRoles.includes('super_admin')).toBe(true);
    expect(staffRoles.includes('super_admin')).toBe(true);
    expect(academicRoles.includes('super_admin')).toBe(true);
  });
});
