"use client";

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

interface CoinData {
  id: string;
  symbol: string;
  name: string;
  priceUsd: number;
  priceKrw: number;
  change24h: number;
}

interface ExchangeData {
  from: string;
  to: string;
  rate: number;
}

interface MarketData {
  coins: CoinData[];
  exchanges: ExchangeData[];
  timestamp: string;
}

type MarketType = 'coins' | 'exchanges';

interface MarketWidgetViewProps {
  type?: MarketType;
  symbols?: string[] | null;
}

export const MarketWidgetView: React.FC<MarketWidgetViewProps> = ({ type = 'coins', symbols = null }) => {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const getTitle = () => {
    switch (type) {
      case 'coins': return '암호화폐';
      case 'exchanges': return '환율';
    }
  };

  const fetchMarketData = async () => {
    try {
      setError(null);
      // symbols가 있으면 쿼리 파라미터로 전달
      const url = symbols && symbols.length > 0
        ? `/api/market?symbols=${symbols.join(',')}`
        : '/api/market';
      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        setMarketData(result.data);
        setLastUpdate(new Date());
      } else {
        setError(result.error || 'Failed to fetch data');
      }
    } catch (err) {
      setError('Network error');
      console.error('Market data fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData();

    // 30초마다 자동 업데이트
    const interval = setInterval(() => {
      fetchMarketData();
    }, 30000);

    // 페이지가 다시 보일 때 데이터 갱신 (탭 전환 시 등)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchMarketData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(symbols)]);

  const formatPrice = (price: number, currency: 'USD' | 'KRW') => {
    if (currency === 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(price);
    } else {
      return new Intl.NumberFormat('ko-KR', {
        style: 'currency',
        currency: 'KRW',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(price);
    }
  };

  const formatChange = (change: number) => {
    const formatted = Math.abs(change).toFixed(2);
    return change >= 0 ? `+${formatted}%` : `-${formatted}%`;
  };

  const getTimeAgo = () => {
    const seconds = Math.floor((new Date().getTime() - lastUpdate.getTime()) / 1000);
    if (seconds < 60) return `${seconds}초 전`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}분 전`;
  };

  if (isLoading) {
    return (
      <div className="market-widget my-4 p-4">
        <div className="flex items-center justify-center gap-2 text-gray-600">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span className="text-sm">로딩 중...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="market-widget my-4 p-4">
        <div className="text-center">
          <p className="text-red-600 text-sm">⚠️ {error}</p>
          <button
            onClick={fetchMarketData}
            className="mt-2 px-3 py-1 text-xs text-blue-600 hover:underline"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  // 데이터 체크
  const hasData =
    (type === 'coins' && marketData?.coins && marketData.coins.length > 0) ||
    (type === 'exchanges' && marketData?.exchanges && marketData.exchanges.length > 0);

  if (!hasData) {
    return (
      <div className="market-widget my-4 p-4">
        <div className="text-center">
          <p className="text-gray-600 text-sm">⚠️ {getTitle()} 데이터를 사용할 수 없습니다</p>
          <button
            onClick={fetchMarketData}
            className="mt-2 px-3 py-1 text-xs text-blue-600 hover:underline"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="market-widget my-4 not-prose">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-900 text-sm">{getTitle()}</h3>
      </div>

      {/* 테이블 */}
      <div className="border border-gray-200 rounded overflow-hidden">
        <table className="w-full text-sm">
          <tbody className="divide-y divide-gray-200">
            {type === 'coins' && marketData?.coins.map((coin) => (
              <tr key={coin.id} className="hover:bg-gray-50">
                <td className="px-3 py-2">
                  <div className="font-medium text-gray-900">{coin.symbol}</div>
                  <div className="text-xs text-gray-500">{coin.name}</div>
                </td>
                <td className="px-3 py-2 text-right">
                  <div className="font-medium text-gray-900">{formatPrice(coin.priceUsd, 'USD')}</div>
                  <div className="text-xs text-gray-500">{formatPrice(coin.priceKrw, 'KRW')}</div>
                </td>
                <td className="px-3 py-2 text-right">
                  <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                    coin.change24h >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {coin.change24h >= 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {formatChange(coin.change24h)}
                  </span>
                </td>
              </tr>
            ))}

            {type === 'exchanges' && marketData?.exchanges.map((exchange, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-3 py-2">
                  <div className="font-medium text-gray-900">{exchange.from}/KRW</div>
                </td>
                <td className="px-3 py-2 text-right" colSpan={2}>
                  <div className="font-medium text-gray-900">
                    {new Intl.NumberFormat('ko-KR').format(exchange.rate)}원
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MarketWidgetView;
