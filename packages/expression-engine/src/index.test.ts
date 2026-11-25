import { describe, it, expect } from 'vitest';
import { evaluateExpression, parseExpression } from './index';

describe('Expression Engine', () => {
  it('passes literal text unchanged', () => {
    expect(evaluateExpression('Invoice Report')).toBe('Invoice Report');
  });

  it('evaluates basic math', () => {
    expect(evaluateExpression('=10 + 20 * 2')).toBe(50);
    expect(evaluateExpression('=(10 + 20) * 2')).toBe(60);
  });

  it('resolves field references', () => {
    const ctx = {
      fields: {
        Quantity: 3,
        UnitPrice: 150000,
        ProductName: 'Mechanical Keyboard',
      },
    };
    expect(evaluateExpression('=Fields.Quantity * Fields.UnitPrice', ctx)).toBe(450000);
    expect(evaluateExpression('=Fields.ProductName', ctx)).toBe('Mechanical Keyboard');
  });

  it('resolves nested array index references with math operations', () => {
    const ctx = {
      fields: {
        items: [
          { name: 'Takumi Vector PDF Engine', price: 5000000, quantity: 1 },
          { name: 'Custom Template Engineering', price: 1500000, quantity: 2 },
        ],
        customer: { name: 'Acme Enterprise' },
      },
    };
    expect(evaluateExpression('=Fields.items.[0].name', ctx)).toBe('Takumi Vector PDF Engine');
    expect(evaluateExpression('=Fields.items[0].price * Fields.items[0].quantity', ctx)).toBe(5000000);
    expect(evaluateExpression('=Fields.items.[1].price * Fields.items.[1].quantity', ctx)).toBe(3000000);
    expect(evaluateExpression('=Fields.customer.name', ctx)).toBe('Acme Enterprise');
  });

  it('handles conditional IIf expressions', () => {
    expect(evaluateExpression('=IIf(5 > 3, "Yes", "No")')).toBe('Yes');
    expect(evaluateExpression('=IIf(2 > 10, "High", "Normal")')).toBe('Normal');
  });

  it('handles functions: Upper, Lower, Concat, FormatCurrency', () => {
    expect(evaluateExpression('=Upper("hello")')).toBe('HELLO');
    expect(evaluateExpression('=Concat("INV-", "2026-", "001")')).toBe('INV-2026-001');
    const curr = evaluateExpression('=FormatCurrency(150000, "id-ID", "IDR")');
    expect(curr).toContain('150.000');
  });

  it('evaluates logic operators: AND, OR, NOT, comparisons', () => {
    expect(evaluateExpression('=True AND False')).toBe(false);
    expect(evaluateExpression('=True OR False')).toBe(true);
    expect(evaluateExpression('=NOT False')).toBe(true);
    expect(evaluateExpression('=100 >= 100')).toBe(true);
    expect(evaluateExpression('="apple" <> "banana"')).toBe(true);
  });
});
