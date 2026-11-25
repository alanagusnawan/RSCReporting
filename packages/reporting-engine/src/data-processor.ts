import { evaluateExpression, EvaluationContext } from '@rsc/expression-engine';
import { Dataset } from '@rsc/report-schema';

export class DataProcessor {
  static extractRows(rawInput: any, dataPath?: string): any[] {
    if (!rawInput) return [];
    if (Array.isArray(rawInput)) return rawInput;
    if (typeof rawInput !== 'object') return [];

    if (!dataPath) {
      if (Array.isArray(rawInput.items)) return rawInput.items;
      if (Array.isArray(rawInput.data)) return rawInput.data;
      if (Array.isArray(rawInput.rows)) return rawInput.rows;
      return [rawInput];
    }

    const parts = dataPath.split('.');
    let current: any = rawInput;
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return [];
      }
    }

    return Array.isArray(current) ? current : [current];
  }

  static applyFiltersAndSorting(rows: any[], dataset?: Dataset): any[] {
    if (!rows || rows.length === 0) return [];
    let result = [...rows];

    // Filter
    if (dataset?.filters && dataset.filters.length > 0) {
      result = result.filter(row => {
        return dataset.filters.every(f => {
          const val = row[f.field];
          switch (f.operator) {
            case '=': return val === f.value;
            case '<>': return val !== f.value;
            case '>': return val > f.value;
            case '>=': return val >= f.value;
            case '<': return val < f.value;
            case '<=': return val <= f.value;
            case 'Like': return String(val).includes(String(f.value));
            default: return true;
          }
        });
      });
    }

    // Sort
    if (dataset?.sorting && dataset.sorting.length > 0) {
      result.sort((a, b) => {
        for (const s of dataset.sorting) {
          const valA = a[s.field];
          const valB = b[s.field];
          if (valA === valB) continue;
          const cmp = valA > valB ? 1 : -1;
          return s.direction === 'desc' ? -cmp : cmp;
        }
        return 0;
      });
    }

    return result;
  }
}
