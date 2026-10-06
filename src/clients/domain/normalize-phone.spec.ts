import { normalizeBrazilianPhone } from './normalize-phone';

describe('normalizeBrazilianPhone', () => {
  it('trata telefone local, internacional e JID do WhatsApp como a mesma chave', () => {
    expect(normalizeBrazilianPhone('(11) 98765-4321')).toBe('5511987654321');
    expect(normalizeBrazilianPhone('+55 11 98765-4321')).toBe('5511987654321');
    expect(normalizeBrazilianPhone('5511987654321@s.whatsapp.net')).toBe(
      '5511987654321',
    );
  });

  it('rejeita telefone sem DDD e números fora do padrão brasileiro', () => {
    expect(normalizeBrazilianPhone('98765-4321')).toBeNull();
    expect(normalizeBrazilianPhone('12345')).toBeNull();
  });
});
