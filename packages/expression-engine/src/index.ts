import { Lexer } from './lexer';
import { Parser, ASTNode } from './parser';
import { Evaluator, EvaluationContext } from './evaluator';

export * from './lexer';
export * from './parser';
export * from './evaluator';

export function parseExpression(expression: string): ASTNode {
  const lexer = new Lexer(expression);
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  return parser.parse();
}

export function evaluateExpression(expression: string, context: EvaluationContext = {}): any {
  if (!expression || typeof expression !== 'string') return expression;
  if (!expression.trim().startsWith('=')) return expression; // Literal text
  const ast = parseExpression(expression);
  const evaluator = new Evaluator(context);
  return evaluator.evaluate(ast);
}
