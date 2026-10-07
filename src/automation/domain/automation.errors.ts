/**
 * Erros de domínio do módulo de automação. Traduzidos para HTTP pela camada
 * de apresentação (AutomationDomainFilter), preservando os status originais:
 * - AutomationNotConfiguredError -> 503 (webhook não configurado)
 * - AutomationUnauthorizedError  -> 401 (evento expirado / assinatura inválida)
 * - AutomationNotFoundError      -> 404 (evento não encontrado)
 */
export class AutomationNotConfiguredError extends Error {}

export class AutomationUnauthorizedError extends Error {}

export class AutomationNotFoundError extends Error {}
