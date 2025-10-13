import { NextRequest, NextResponse } from 'next/server';

// 사용 가능한 코인 목록 (CoinGecko ID)
const AVAILABLE_COINS: Record<string, string> = {
  // Top 10
  'bitcoin': 'BTC',
  'ethereum': 'ETH',
  'tether': 'USDT',
  'binancecoin': 'BNB',
  'solana': 'SOL',
  'ripple': 'XRP',
  'usd-coin': 'USDC',
  'cardano': 'ADA',
  'dogecoin': 'DOGE',
  'tron': 'TRX',

  // Top 11-20
  'avalanche-2': 'AVAX',
  'polkadot': 'DOT',
  'chainlink': 'LINK',
  'polygon': 'MATIC',
  'shiba-inu': 'SHIB',
  'litecoin': 'LTC',
  'bitcoin-cash': 'BCH',
  'uniswap': 'UNI',
  'stellar': 'XLM',
  'cosmos': 'ATOM',

  // Top 21-30
  'ethereum-classic': 'ETC',
  'near': 'NEAR',
  'aptos': 'APT',
  'arbitrum': 'ARB',
  'optimism': 'OP',
  'filecoin': 'FIL',
  'the-graph': 'GRT',
  'algorand': 'ALGO',
  'vechain': 'VET',
  'internet-computer': 'ICP',
};

// 사용 가능한 통화 목록
const AVAILABLE_CURRENCIES = [
  'USD', 'EUR', 'JPY', 'GBP', 'CNY',
  'HKD', 'SGD', 'TWD', 'THB', 'INR',
  'AUD', 'NZD',
  'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON',
  'CAD', 'MXN', 'BRL',
  'TRY', 'ZAR', 'ILS'
];

export async function GET(request: NextRequest) {
  try {
    // 쿼리 파라미터에서 선택된 symbols 가져오기
    const { searchParams } = new URL(request.url);
    const symbolsParam = searchParams.get('symbols');
    const selectedSymbols = symbolsParam ? symbolsParam.split(',') : null;

    // 코인 목록 결정
    let coinIds: string[] = [];
    if (selectedSymbols && selectedSymbols.length > 0) {
      coinIds = selectedSymbols.filter(s => s in AVAILABLE_COINS);
    }
    // 코인이 하나도 없으면 기본값 사용
    if (coinIds.length === 0) {
      coinIds = ['bitcoin', 'ethereum', 'ripple'];
    }

    // 환율 목록 결정
    let currencies: string[] = [];
    if (selectedSymbols && selectedSymbols.length > 0) {
      currencies = selectedSymbols.filter(s => AVAILABLE_CURRENCIES.includes(s));
    }
    // 환율이 하나도 없으면 기본값 사용
    if (currencies.length === 0) {
      currencies = ['EUR', 'JPY', 'CNY', 'GBP', 'AUD'];
    }

    // 병렬로 API 호출 (캐싱 없이 항상 최신 데이터 가져오기)
    const [coinResponse, exchangeResponse] = await Promise.allSettled([
      // 1. CoinGecko API - 코인 시세
      fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds.join(',')}&vs_currencies=usd,krw&include_24hr_change=true`,
        {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          cache: 'no-store' // 캐싱 비활성화 - 항상 실시간 데이터
        }
      ),
      // 2. Frankfurter API - 환율 (완전 무료, 제한 없음)
      fetch(
        `https://api.frankfurter.app/latest?from=USD&to=${currencies.join(',')}${currencies.includes('KRW') ? '' : ',KRW'}`,
        {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          cache: 'no-store' // 캐싱 비활성화 - 항상 실시간 데이터
        }
      )
    ]);

    // 코인 데이터 처리
    let coinData = null;
    if (coinResponse.status === 'fulfilled' && coinResponse.value.ok) {
      coinData = await coinResponse.value.json();
    } else {
      console.error('CoinGecko API failed');
    }

    // 환율 데이터 처리
    let exchangeData = null;
    if (exchangeResponse.status === 'fulfilled' && exchangeResponse.value.ok) {
      exchangeData = await exchangeResponse.value.json();
    } else {
      console.error('Frankfurter API failed');
    }

    // 데이터 변환
    const marketData = {
      coins: coinData ? coinIds.map(coinId => ({
        id: coinId,
        symbol: AVAILABLE_COINS[coinId],
        name: coinId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        priceUsd: coinData[coinId]?.usd || 0,
        priceKrw: coinData[coinId]?.krw || 0,
        change24h: coinData[coinId]?.usd_24h_change || 0,
      })) : [],
      exchanges: exchangeData ? [
        {
          from: 'USD',
          to: 'KRW',
          rate: exchangeData.rates?.KRW || 0,
        },
        ...currencies.filter(c => c !== 'USD').map(currency => ({
          from: currency,
          to: 'KRW',
          rate: currency === 'JPY'
            ? (exchangeData.rates?.KRW || 0) / (exchangeData.rates?.JPY || 1) * 100
            : (exchangeData.rates?.KRW || 0) / (exchangeData.rates?.[currency] || 1),
        })),
      ] : [],
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: marketData,
    });

  } catch (error) {
    console.error('❌ Market data fetch error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch market data',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
