export interface SchemaFieldItem {
  path: string; // e.g. "items.[0].name", "items.name", or "customer.name"
  label: string; // e.g. "items.[0].name (string)"
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  rawKey: string; // e.g. "name"
  parentPath: string; // e.g. "items.[0]" or "customer"
}

export function extractSchemaPaths(obj: any, prefix = ''): SchemaFieldItem[] {
  if (!obj || typeof obj !== 'object') return [];

  const results: SchemaFieldItem[] = [];

  for (const key of Object.keys(obj)) {
    const value = obj[key];
    const currentPath = prefix ? `${prefix}.${key}` : key;

    if (Array.isArray(value)) {
      results.push({
        path: currentPath,
        label: `${currentPath} (array[${value.length}])`,
        type: 'array',
        rawKey: key,
        parentPath: prefix,
      });

      if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
        // 1. Array index notation: items.[0].name
        const arrayIndexPrefix = `${currentPath}.[0]`;
        const indexFields = extractSchemaPaths(value[0], arrayIndexPrefix);
        results.push(...indexFields);

        // 2. Shorthand notation: items.name
        const shorthandFields = extractSchemaPaths(value[0], currentPath);
        results.push(...shorthandFields);

        // 3. Raw column keys: name, price, quantity
        for (const childKey of Object.keys(value[0])) {
          results.push({
            path: childKey,
            label: `${childKey} (${typeof value[0][childKey]})`,
            type: typeof value[0][childKey] === 'number' ? 'number' : 'string',
            rawKey: childKey,
            parentPath: currentPath,
          });
        }
      }
    } else if (value !== null && typeof value === 'object') {
      results.push({
        path: currentPath,
        label: `${currentPath} (object)`,
        type: 'object',
        rawKey: key,
        parentPath: prefix,
      });
      results.push(...extractSchemaPaths(value, currentPath));
    } else {
      const valType = typeof value === 'number' ? 'number' : typeof value === 'boolean' ? 'boolean' : 'string';
      results.push({
        path: currentPath,
        label: `${currentPath} (${valType})`,
        type: valType,
        rawKey: key,
        parentPath: prefix,
      });
    }
  }

  // Deduplicate
  const map = new Map<string, SchemaFieldItem>();
  for (const item of results) {
    if (!map.has(item.path)) {
      map.set(item.path, item);
    }
  }

  return Array.from(map.values());
}

export function getFieldSuggestions(currentToken: string, allFields: SchemaFieldItem[]): SchemaFieldItem[] {
  if (!currentToken) return allFields.slice(0, 10);

  // Strip formula prefixes if any
  const clean = currentToken.replace(/^(=Fields\.|=|\s*)/, '').trim();

  // If user typed dot at end: e.g. "items.[0]." or "customer."
  if (clean.endsWith('.')) {
    const parent = clean.slice(0, -1);
    const children = allFields.filter(f => f.parentPath === parent || f.path.startsWith(clean));
    if (children.length > 0) return children;
  }

  // Match prefix or contains
  return allFields.filter(f =>
    f.path.toLowerCase().includes(clean.toLowerCase()) ||
    f.rawKey.toLowerCase().includes(clean.toLowerCase())
  );
}

// Validates field paths inside free text or mathematical formula (supporting +, -, *, /, parenthesis)
export function validateFieldPath(input: string, allFields: SchemaFieldItem[]): { valid: boolean; message?: string } {
  if (!input || !input.trim()) return { valid: true };

  const trimmed = input.trim();

  // If pure literal string without formula or dot, valid
  if (!trimmed.startsWith('=') && !trimmed.includes('Fields.') && !trimmed.includes('.[0].')) {
    return { valid: true };
  }

  // Tokenize words that look like field identifiers or paths (excluding operators +, -, *, /, numbers, parentheses)
  // Example tokens from "=Fields.items.[0].price * Fields.items.[0].quantity":
  // ["Fields.items.[0].price", "Fields.items.[0].quantity"]
  const cleanExpr = trimmed.replace(/^=/, '');
  const tokens = cleanExpr.match(/[a-zA-Z_][a-zA-Z0-9_]*(?:\.\[[0-9]+\]|\.[a-zA-Z0-9_]+)*/g);

  if (!tokens || tokens.length === 0) {
    return { valid: true };
  }

  const validPaths = new Set(allFields.map(f => f.path));
  const validRawKeys = new Set(allFields.map(f => f.rawKey));
  const standardBuiltins = new Set(['Fields', 'Parameters', 'Report', 'Globals', 'Sum', 'Count', 'Avg', 'Min', 'Max', 'IIf', 'FormatCurrency', 'Concat']);

  for (const tok of tokens) {
    // If it's a builtin function or root prefix, skip
    if (standardBuiltins.has(tok)) continue;

    // Normalize path by stripping Fields. or Parameters.
    const normalized = tok.replace(/^(Fields\.|Parameters\.)/, '');

    if (!validPaths.has(normalized) && !validRawKeys.has(normalized) && !validPaths.has(tok)) {
      return {
        valid: false,
        message: `Field '${tok}' tidak ditemukan dalam schema data source!`,
      };
    }
  }

  return { valid: true };
}
