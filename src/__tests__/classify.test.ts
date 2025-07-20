import { classify } from '../scanner/classify';
import { fetchTA } from '../scanner/taapi';
import { classifyWithLLM } from '../llm/classifyWithLLM';
import axios from 'axios';

// Mock all external dependencies
jest.mock('axios');
jest.mock('../scanner/taapi');
jest.mock('../llm/classifyWithLLM');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedFetchTA = fetchTA as jest.MockedFunction<typeof fetchTA>;
const mockedClassifyWithLLM = classifyWithLLM as jest.MockedFunction<typeof classifyWithLLM>;

describe('classify', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return a complete classification result on success', async () => {
    // Mock successful API responses
    mockedAxios.get.mockResolvedValue({
      data: {
        data: {
          BTC: [{ quote: { USD: { price: 45000 } } }]
        }
      }
    });

    mockedFetchTA.mockResolvedValue({
      ema20: 44500,
      adx: 65
    });

    mockedClassifyWithLLM.mockResolvedValue({
      regime: 'trending' as const,
      confidence: 0.85
    });

    const result = await classify('BTC');

    expect(result).toEqual({
      symbol: 'BTC',
      regime: 'trending',
      confidence: 0.85,
      lastPrice: 45000,
      indicators: { ema20: 44500, adx: 65 },
      model: 'gpt-4o'
    });
  });

  it('should return unknown regime with error model on API failure', async () => {
    // Mock API failure
    mockedAxios.get.mockRejectedValue(new Error('API Error'));
    mockedFetchTA.mockRejectedValue(new Error('TA API Error'));

    const result = await classify('BTC');

    expect(result).toEqual({
      symbol: 'BTC',
      regime: 'unknown',
      confidence: 0,
      lastPrice: NaN,
      indicators: {},
      model: 'error_n/a'
    });
  });
});
