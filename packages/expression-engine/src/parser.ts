import { Token, TokenType } from './lexer';

export type ASTNode =
  | { type: 'Literal'; value: any }
  | { type: 'Identifier'; name: string }
  | { type: 'MemberAccess'; object: ASTNode; property: string }
  | { type: 'IndexAccess'; object: ASTNode; index: ASTNode }
  | { type: 'UnaryOp'; operator: string; argument: ASTNode }
  | { type: 'BinaryOp'; operator: string; left: ASTNode; right: ASTNode }
  | { type: 'FunctionCall'; name: string; args: ASTNode[] };

export class Parser {
  private tokens: Token[];
  private current = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): ASTNode {
    const node = this.parseExpression();
    if (!this.isAtEnd()) {
      throw new Error(`Unexpected token at end of expression: ${this.peek().value}`);
    }
    return node;
  }

  private parseExpression(): ASTNode {
    return this.parseLogicalOr();
  }

  private parseLogicalOr(): ASTNode {
    let left = this.parseLogicalAnd();
    while (this.match('OR')) {
      const operator = this.previous().value;
      const right = this.parseLogicalAnd();
      left = { type: 'BinaryOp', operator, left, right };
    }
    return left;
  }

  private parseLogicalAnd(): ASTNode {
    let left = this.parseEquality();
    while (this.match('AND')) {
      const operator = this.previous().value;
      const right = this.parseEquality();
      left = { type: 'BinaryOp', operator, left, right };
    }
    return left;
  }

  private parseEquality(): ASTNode {
    let left = this.parseRelational();
    while (this.match('EQ', 'NEQ')) {
      const operator = this.previous().value;
      const right = this.parseRelational();
      left = { type: 'BinaryOp', operator, left, right };
    }
    return left;
  }

  private parseRelational(): ASTNode {
    let left = this.parseAdditive();
    while (this.match('LT', 'LTE', 'GT', 'GTE')) {
      const operator = this.previous().value;
      const right = this.parseAdditive();
      left = { type: 'BinaryOp', operator, left, right };
    }
    return left;
  }

  private parseAdditive(): ASTNode {
    let left = this.parseMultiplicative();
    while (this.match('PLUS', 'MINUS')) {
      const operator = this.previous().value;
      const right = this.parseMultiplicative();
      left = { type: 'BinaryOp', operator, left, right };
    }
    return left;
  }

  private parseMultiplicative(): ASTNode {
    let left = this.parseUnary();
    while (this.match('MULTIPLY', 'DIVIDE', 'MODULO')) {
      const operator = this.previous().value;
      const right = this.parseUnary();
      left = { type: 'BinaryOp', operator, left, right };
    }
    return left;
  }

  private parseUnary(): ASTNode {
    if (this.match('NOT', 'MINUS')) {
      const operator = this.previous().value;
      const argument = this.parseUnary();
      return { type: 'UnaryOp', operator, argument };
    }
    return this.parsePrimary();
  }

  private parsePrimary(): ASTNode {
    if (this.match('NUMBER', 'STRING', 'BOOLEAN', 'NULL')) {
      return { type: 'Literal', value: this.previous().value };
    }

    if (this.match('IDENTIFIER')) {
      const idName = this.previous().value;

      // Function call
      if (this.match('LPAREN')) {
        const args: ASTNode[] = [];
        if (!this.check('RPAREN')) {
          do {
            args.push(this.parseExpression());
          } while (this.match('COMMA'));
        }
        this.consume('RPAREN', "Expect ')' after arguments.");
        return { type: 'FunctionCall', name: idName, args };
      }

      // Variable / member reference (e.g. Fields.items.[0].price or items[0].price)
      let node: ASTNode = { type: 'Identifier', name: idName };
      while (true) {
        if (this.match('DOT')) {
          if (this.match('LBRACKET')) {
            const indexExpr = this.parseExpression();
            this.consume('RBRACKET', "Expect ']' after index.");
            node = { type: 'IndexAccess', object: node, index: indexExpr };
          } else {
            const propToken = this.consume('IDENTIFIER', "Expect property name after '.'.");
            node = { type: 'MemberAccess', object: node, property: propToken.value };
          }
        } else if (this.match('LBRACKET')) {
          const indexExpr = this.parseExpression();
          this.consume('RBRACKET', "Expect ']' after index.");
          node = { type: 'IndexAccess', object: node, index: indexExpr };
        } else {
          break;
        }
      }
      return node;
    }

    if (this.match('LPAREN')) {
      const expr = this.parseExpression();
      this.consume('RPAREN', "Expect ')' after expression.");
      return expr;
    }

    throw new Error(`Unexpected token '${this.peek().value}' at pos ${this.peek().pos}`);
  }

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === 'EOF';
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    throw new Error(`${message} Got '${this.peek().value}'`);
  }
}
