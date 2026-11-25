import { ASTNode } from './parser';

export interface EvaluationContext {
  fields?: Record<string, any>;
  parameters?: Record<string, any>;
  globals?: Record<string, any>;
  rowNumber?: number;
  aggregates?: Record<string, any>;
}

export class Evaluator {
  private context: EvaluationContext;

  constructor(context: EvaluationContext = {}) {
    this.context = {
      fields: context.fields || {},
      parameters: context.parameters || {},
      globals: context.globals || {},
      rowNumber: context.rowNumber ?? 1,
      aggregates: context.aggregates || {},
    };
  }

  evaluate(node: ASTNode): any {
    switch (node.type) {
      case 'Literal':
        return node.value;

      case 'Identifier': {
        const id = node.name.toLowerCase();
        if (id === 'rowindex' || id === 'rownumber') return this.context.rowNumber;
        if (this.context.fields && node.name in this.context.fields) return this.context.fields[node.name];
        if (this.context.parameters && node.name in this.context.parameters) return this.context.parameters[node.name];
        return undefined;
      }

      case 'MemberAccess': {
        if (node.object.type === 'Identifier') {
          const root = node.object.name.toUpperCase();
          if (root === 'FIELDS' || root === 'FIELD') {
            return this.context.fields?.[node.property];
          }
          if (root === 'PARAMETERS' || root === 'PARAMETER') {
            return this.context.parameters?.[node.property];
          }
          if (root === 'GLOBALS' || root === 'REPORT') {
            return this.context.globals?.[node.property];
          }
        }
        const obj = this.evaluate(node.object);
        if (obj && typeof obj === 'object') {
          return obj[node.property];
        }
        return undefined;
      }

      case 'IndexAccess': {
        const obj = this.evaluate(node.object);
        const idx = this.evaluate(node.index);
        if (Array.isArray(obj)) {
          return obj[Number(idx)];
        }
        if (obj && typeof obj === 'object') {
          return obj[idx];
        }
        return undefined;
      }

      case 'UnaryOp': {
        const arg = this.evaluate(node.argument);
        if (node.operator === '-') return -arg;
        if (node.operator === 'NOT' || node.operator === '!') return !arg;
        return arg;
      }

      case 'BinaryOp': {
        const left = this.evaluate(node.left);
        const right = this.evaluate(node.right);
        switch (node.operator) {
          case '+': return (typeof left === 'string' || typeof right === 'string') ? `${left ?? ''}${right ?? ''}` : (left ?? 0) + (right ?? 0);
          case '-': return (left ?? 0) - (right ?? 0);
          case '*': return (left ?? 0) * (right ?? 0);
          case '/': return right !== 0 ? (left ?? 0) / right : 0;
          case '%': return (left ?? 0) % (right ?? 1);
          case '=':
          case '==': return left === right;
          case '<>':
          case '!=': return left !== right;
          case '>': return (left ?? 0) > (right ?? 0);
          case '>=': return (left ?? 0) >= (right ?? 0);
          case '<': return (left ?? 0) < (right ?? 0);
          case '<=': return (left ?? 0) <= (right ?? 0);
          case 'AND': return Boolean(left) && Boolean(right);
          case 'OR': return Boolean(left) || Boolean(right);
          default:
            throw new Error(`Unknown operator: ${node.operator}`);
        }
      }

      case 'FunctionCall': {
        const fnName = node.name.toUpperCase();
        const args = node.args.map(a => this.evaluate(a));

        switch (fnName) {
          case 'IIF':
          case 'IF':
            return args[0] ? args[1] : args[2];
          case 'SUM':
          case 'COUNT':
          case 'AVG':
          case 'MIN':
          case 'MAX':
            return this.context.aggregates?.[this.serializeNode(node)] ?? args[0];
          case 'UPPER':
            return String(args[0] ?? '').toUpperCase();
          case 'LOWER':
            return String(args[0] ?? '').toLowerCase();
          case 'CONCAT':
            return args.join('');
          case 'ROUND':
            return Number(Number(args[0] ?? 0).toFixed(args[1] ?? 0));
          case 'FORMAT':
          case 'FORMATCURRENCY': {
            const val = Number(args[0] ?? 0);
            const locale = args[1] || 'id-ID';
            const currency = args[2] || 'IDR';
            return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(val);
          }
          case 'FORMATNUMBER': {
            const val = Number(args[0] ?? 0);
            const decimals = args[1] ?? 0;
            return new Intl.NumberFormat('id-ID', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(val);
          }
          case 'FORMATDATE': {
            const d = new Date(args[0]);
            return isNaN(d.getTime()) ? '' : d.toLocaleDateString(args[1] || 'id-ID');
          }
          case 'NOW':
            return new Date().toISOString();
          default:
            throw new Error(`Unsupported expression function: ${node.name}`);
        }
      }
    }
  }

  private serializeNode(node: ASTNode): string {
    if (node.type === 'FunctionCall') {
      return `${node.name}(${node.args.map(a => this.serializeNode(a)).join(',')})`;
    }
    if (node.type === 'MemberAccess') {
      return `${this.serializeNode(node.object)}.${node.property}`;
    }
    if (node.type === 'IndexAccess') {
      return `${this.serializeNode(node.object)}[${this.serializeNode(node.index)}]`;
    }
    if (node.type === 'Identifier') return node.name;
    if (node.type === 'Literal') return String(node.value);
    return '';
  }
}
