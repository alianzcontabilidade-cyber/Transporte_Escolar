import { describe, it, expect } from 'vitest';

// Funções de formatação usadas no sistema

describe('Formatação de CPF', () => {
  function maskCPF(cpf: string): string {
    const d = cpf.replace(/\D/g, '');
    if (d.length <= 3) return d;
    if (d.length <= 6) return d.slice(0,3) + '.' + d.slice(3);
    if (d.length <= 9) return d.slice(0,3) + '.' + d.slice(3,6) + '.' + d.slice(6);
    return d.slice(0,3) + '.' + d.slice(3,6) + '.' + d.slice(6,9) + '-' + d.slice(9,11);
  }

  it('deve formatar CPF completo', () => {
    expect(maskCPF('52998224725')).toBe('529.982.247-25');
  });

  it('deve formatar CPF parcial', () => {
    expect(maskCPF('529')).toBe('529');
    expect(maskCPF('529982')).toBe('529.982');
    expect(maskCPF('529982247')).toBe('529.982.247');
  });

  it('deve lidar com CPF já formatado', () => {
    expect(maskCPF('529.982.247-25')).toBe('529.982.247-25');
  });
});

describe('Formatação de CNPJ', () => {
  function maskCNPJ(cnpj: string): string {
    const d = cnpj.replace(/\D/g, '');
    if (d.length <= 2) return d;
    if (d.length <= 5) return d.slice(0,2) + '.' + d.slice(2);
    if (d.length <= 8) return d.slice(0,2) + '.' + d.slice(2,5) + '.' + d.slice(5);
    if (d.length <= 12) return d.slice(0,2) + '.' + d.slice(2,5) + '.' + d.slice(5,8) + '/' + d.slice(8);
    return d.slice(0,2) + '.' + d.slice(2,5) + '.' + d.slice(5,8) + '/' + d.slice(8,12) + '-' + d.slice(12,14);
  }

  it('deve formatar CNPJ completo', () => {
    expect(maskCNPJ('11222333000181')).toBe('11.222.333/0001-81');
  });
});

describe('Formatação de Telefone', () => {
  function maskPhone(phone: string): string {
    const d = phone.replace(/\D/g, '');
    if (d.length <= 2) return d.length ? '(' + d : '';
    if (d.length <= 6) return '(' + d.slice(0,2) + ') ' + d.slice(2);
    if (d.length <= 10) return '(' + d.slice(0,2) + ') ' + d.slice(2,6) + '-' + d.slice(6);
    return '(' + d.slice(0,2) + ') ' + d.slice(2,7) + '-' + d.slice(7,11);
  }

  it('deve formatar celular (11 dígitos)', () => {
    expect(maskPhone('63999887766')).toBe('(63) 99988-7766');
  });

  it('deve formatar fixo (10 dígitos)', () => {
    expect(maskPhone('6333651337')).toBe('(63) 3365-1337');
  });
});

describe('Formatação de Data', () => {
  function formatDate(d: string | Date | undefined): string {
    if (!d) return '--';
    const dt = typeof d === 'string' ? new Date(d) : d;
    if (isNaN(dt.getTime())) return String(d);
    return `${dt.getDate().toString().padStart(2,'0')}/${(dt.getMonth()+1).toString().padStart(2,'0')}/${dt.getFullYear()}`;
  }

  it('deve formatar data ISO', () => {
    // Usar formato com hora para evitar problema de timezone
    expect(formatDate('2024-03-15T12:00:00')).toBe('15/03/2024');
  });

  it('deve formatar objeto Date', () => {
    expect(formatDate(new Date(2024, 0, 1))).toBe('01/01/2024');
  });

  it('deve retornar -- para data vazia', () => {
    expect(formatDate(undefined)).toBe('--');
    expect(formatDate('')).toBe('--');
  });
});

describe('Formatação de Moeda', () => {
  function formatMoney(value: number): string {
    return 'R$ ' + value.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  it('deve formatar valores monetários', () => {
    expect(formatMoney(1234.56)).toBe('R$ 1.234,56');
    expect(formatMoney(0)).toBe('R$ 0,00');
    expect(formatMoney(99.9)).toBe('R$ 99,90');
    expect(formatMoney(1000000)).toBe('R$ 1.000.000,00');
  });
});

describe('Validação de E-mail', () => {
  function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  it('deve aceitar emails válidos', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('admin@escola.gov.br')).toBe(true);
    expect(isValidEmail('jose.silva@gmail.com')).toBe(true);
  });

  it('deve rejeitar emails inválidos', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('sem-arroba')).toBe(false);
    expect(isValidEmail('@sem-usuario.com')).toBe(false);
    expect(isValidEmail('user@')).toBe(false);
  });
});
