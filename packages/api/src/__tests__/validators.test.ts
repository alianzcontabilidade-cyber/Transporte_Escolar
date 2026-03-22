import { describe, it, expect } from 'vitest';
import { validateCPF, validateCNPJ, validateOptionalCPF, validateOptionalCNPJ } from '../trpc';

describe('validateCPF', () => {
  it('deve aceitar CPF válido', () => {
    expect(validateCPF('529.982.247-25')).toBe(true);
    expect(validateCPF('52998224725')).toBe(true);
  });

  it('deve rejeitar CPF inválido', () => {
    expect(validateCPF('123.456.789-00')).toBe(false);
    expect(validateCPF('00000000000')).toBe(false);
    expect(validateCPF('11111111111')).toBe(false);
  });

  it('deve rejeitar CPF com tamanho errado', () => {
    expect(validateCPF('123')).toBe(false);
    expect(validateCPF('')).toBe(false);
    expect(validateCPF('1234567890123')).toBe(false);
  });

  it('deve rejeitar CPF com todos os dígitos iguais', () => {
    for (let i = 0; i <= 9; i++) {
      expect(validateCPF(String(i).repeat(11))).toBe(false);
    }
  });
});

describe('validateCNPJ', () => {
  it('deve aceitar CNPJ válido', () => {
    expect(validateCNPJ('11.222.333/0001-81')).toBe(true);
    expect(validateCNPJ('11222333000181')).toBe(true);
  });

  it('deve rejeitar CNPJ inválido', () => {
    expect(validateCNPJ('11.222.333/0001-00')).toBe(false);
    expect(validateCNPJ('00000000000000')).toBe(false);
  });

  it('deve rejeitar CNPJ com tamanho errado', () => {
    expect(validateCNPJ('123')).toBe(false);
    expect(validateCNPJ('')).toBe(false);
  });

  it('deve rejeitar CNPJ com todos os dígitos iguais', () => {
    for (let i = 0; i <= 9; i++) {
      expect(validateCNPJ(String(i).repeat(14))).toBe(false);
    }
  });
});

describe('validateOptionalCPF', () => {
  it('deve aceitar CPF vazio ou undefined', () => {
    expect(() => validateOptionalCPF(undefined)).not.toThrow();
    expect(() => validateOptionalCPF('')).not.toThrow();
  });

  it('deve aceitar CPF válido', () => {
    expect(() => validateOptionalCPF('529.982.247-25')).not.toThrow();
  });

  it('deve lançar erro para CPF inválido', () => {
    expect(() => validateOptionalCPF('12345678900')).toThrow('CPF inválido');
  });

  it('deve lançar erro para CPF incompleto', () => {
    expect(() => validateOptionalCPF('123456')).toThrow('CPF incompleto');
  });
});

describe('validateOptionalCNPJ', () => {
  it('deve aceitar CNPJ vazio ou undefined', () => {
    expect(() => validateOptionalCNPJ(undefined)).not.toThrow();
    expect(() => validateOptionalCNPJ('')).not.toThrow();
  });

  it('deve aceitar CNPJ válido', () => {
    expect(() => validateOptionalCNPJ('11.222.333/0001-81')).not.toThrow();
  });

  it('deve lançar erro para CNPJ inválido', () => {
    expect(() => validateOptionalCNPJ('11222333000100')).toThrow('CNPJ inválido');
  });

  it('deve lançar erro para CNPJ incompleto', () => {
    expect(() => validateOptionalCNPJ('112223')).toThrow('CNPJ incompleto');
  });
});
