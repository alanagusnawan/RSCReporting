export type TokenType =
  | 'NUMBER'
  | 'STRING'
  | 'BOOLEAN'
  | 'NULL'
  | 'IDENTIFIER'
  | 'DOT'
  | 'COMMA'
  | 'LPAREN'
  | 'RPAREN'
  | 'LBRACKET'
  | 'RBRACKET'
  | 'PLUS'
  | 'MINUS'
  | 'MULTIPLY'
  | 'DIVIDE'
  | 'MODULO'
  | 'EQ'
  | 'NEQ'
  | 'GT'
  | 'GTE'
  | 'LT'
  | 'LTE'
  | 'AND'
  | 'OR'
  | 'NOT'
  | 'EOF';

export interface Token {
  type: TokenType;
  value: any;
  pos: number;
}

export class Lexer {
  private input: string;
  private pos = 0;

  constructor(input: string) {
    this.input = input.trim().startsWith('=') ? input.trim().slice(1).trim() : input.trim();
  }

  tokenize(): Token[] {
    const tokens: Token[] = [];
    while (this.pos < this.input.length) {
      const char = this.input[this.pos];

      if (/\s/.test(char)) {
        this.pos++;
        continue;
      }

      if (char === '"' || char === "'") {
        tokens.push(this.readString(char));
        continue;
      }

      if (/[0-9]/.test(char)) {
        tokens.push(this.readNumber());
        continue;
      }

      if (/[a-zA-Z_]/.test(char)) {
        tokens.push(this.readIdentifier());
        continue;
      }

      // Multi-character operators
      if (char === '<') {
        const next = this.input[this.pos + 1];
        if (next === '=') {
          tokens.push({ type: 'LTE', value: '<=', pos: this.pos });
          this.pos += 2;
          continue;
        }
        if (next === '>') {
          tokens.push({ type: 'NEQ', value: '<>', pos: this.pos });
          this.pos += 2;
          continue;
        }
        tokens.push({ type: 'LT', value: '<', pos: this.pos++ });
        continue;
      }

      if (char === '>') {
        if (this.input[this.pos + 1] === '=') {
          tokens.push({ type: 'GTE', value: '>=', pos: this.pos });
          this.pos += 2;
          continue;
        }
        tokens.push({ type: 'GT', value: '>', pos: this.pos++ });
        continue;
      }

      if (char === '=') {
        if (this.input[this.pos + 1] === '=') {
          tokens.push({ type: 'EQ', value: '==', pos: this.pos });
          this.pos += 2;
          continue;
        }
        tokens.push({ type: 'EQ', value: '=', pos: this.pos++ });
        continue;
      }

      if (char === '!' && this.input[this.pos + 1] === '=') {
        tokens.push({ type: 'NEQ', value: '!=', pos: this.pos });
        this.pos += 2;
        continue;
      }

      // Single char
      switch (char) {
        case '+': tokens.push({ type: 'PLUS', value: '+', pos: this.pos++ }); break;
        case '-': tokens.push({ type: 'MINUS', value: '-', pos: this.pos++ }); break;
        case '*': tokens.push({ type: 'MULTIPLY', value: '*', pos: this.pos++ }); break;
        case '/': tokens.push({ type: 'DIVIDE', value: '/', pos: this.pos++ }); break;
        case '%': tokens.push({ type: 'MODULO', value: '%', pos: this.pos++ }); break;
        case '(': tokens.push({ type: 'LPAREN', value: '(', pos: this.pos++ }); break;
        case ')': tokens.push({ type: 'RPAREN', value: ')', pos: this.pos++ }); break;
        case '[': tokens.push({ type: 'LBRACKET', value: '[', pos: this.pos++ }); break;
        case ']': tokens.push({ type: 'RBRACKET', value: ']', pos: this.pos++ }); break;
        case '.': tokens.push({ type: 'DOT', value: '.', pos: this.pos++ }); break;
        case ',': tokens.push({ type: 'COMMA', value: ',', pos: this.pos++ }); break;
        default:
          throw new Error(`Unexpected character '${char}' at index ${this.pos}`);
      }
    }

    tokens.push({ type: 'EOF', value: null, pos: this.pos });
    return tokens;
  }

  private readString(quote: string): Token {
    const start = this.pos;
    this.pos++;
    let str = '';
    while (this.pos < this.input.length) {
      const char = this.input[this.pos];
      if (char === '\\') {
        this.pos++;
        str += this.input[this.pos] || '';
      } else if (char === quote) {
        this.pos++;
        return { type: 'STRING', value: str, pos: start };
      } else {
        str += char;
      }
      this.pos++;
    }
    throw new Error(`Unterminated string starting at index ${start}`);
  }

  private readNumber(): Token {
    const start = this.pos;
    let numStr = '';
    while (this.pos < this.input.length && /[0-9.]/.test(this.input[this.pos])) {
      numStr += this.input[this.pos++];
    }
    return { type: 'NUMBER', value: parseFloat(numStr), pos: start };
  }

  private readIdentifier(): Token {
    const start = this.pos;
    let id = '';
    while (this.pos < this.input.length && /[a-zA-Z0-9_]/.test(this.input[this.pos])) {
      id += this.input[this.pos++];
    }

    const upper = id.toUpperCase();
    if (upper === 'TRUE') return { type: 'BOOLEAN', value: true, pos: start };
    if (upper === 'FALSE') return { type: 'BOOLEAN', value: false, pos: start };
    if (upper === 'NULL') return { type: 'NULL', value: null, pos: start };
    if (upper === 'AND') return { type: 'AND', value: 'AND', pos: start };
    if (upper === 'OR') return { type: 'OR', value: 'OR', pos: start };
    if (upper === 'NOT') return { type: 'NOT', value: 'NOT', pos: start };

    return { type: 'IDENTIFIER', value: id, pos: start };
  }
}
