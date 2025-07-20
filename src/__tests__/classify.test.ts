import { classify } from '../agents/cryptoScanner/classify';

describe('classify', () => {
  it('should return a result object', async () => {
    // This is a placeholder test - in real code you would mock API calls
    await expect(classify('BTC')).resolves.toHaveProperty('symbol', 'BTC');
  });
});
