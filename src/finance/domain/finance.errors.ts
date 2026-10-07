/**
 * Erro de regra de negócio do módulo financeiro. É traduzido para HTTP
 * pela camada de apresentação (FinanceDomainFilter).
 */
export class FinanceValidationError extends Error {}

/** Recurso financeiro não encontrado (ex.: pagamento ou atendimento). */
export class FinanceNotFoundError extends Error {}

/** Conflito de estado (ex.: atendimento já concluído, pagamento já recebido). */
export class FinanceConflictError extends Error {}
