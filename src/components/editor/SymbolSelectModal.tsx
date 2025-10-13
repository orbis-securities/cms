"use client";

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface SymbolSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (symbols: string[]) => void;
  type: 'coins' | 'exchanges';
}

const COIN_OPTIONS = [
  // Top 10
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
  { id: 'tether', symbol: 'USDT', name: 'Tether' },
  { id: 'binancecoin', symbol: 'BNB', name: 'BNB' },
  { id: 'solana', symbol: 'SOL', name: 'Solana' },
  { id: 'ripple', symbol: 'XRP', name: 'Ripple' },
  { id: 'usd-coin', symbol: 'USDC', name: 'USD Coin' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano' },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin' },
  { id: 'tron', symbol: 'TRX', name: 'TRON' },

  // Top 11-20
  { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche' },
  { id: 'polkadot', symbol: 'DOT', name: 'Polkadot' },
  { id: 'chainlink', symbol: 'LINK', name: 'Chainlink' },
  { id: 'polygon', symbol: 'MATIC', name: 'Polygon' },
  { id: 'shiba-inu', symbol: 'SHIB', name: 'Shiba Inu' },
  { id: 'litecoin', symbol: 'LTC', name: 'Litecoin' },
  { id: 'bitcoin-cash', symbol: 'BCH', name: 'Bitcoin Cash' },
  { id: 'uniswap', symbol: 'UNI', name: 'Uniswap' },
  { id: 'stellar', symbol: 'XLM', name: 'Stellar' },
  { id: 'cosmos', symbol: 'ATOM', name: 'Cosmos' },

  // Top 21-30
  { id: 'ethereum-classic', symbol: 'ETC', name: 'Ethereum Classic' },
  { id: 'near', symbol: 'NEAR', name: 'NEAR Protocol' },
  { id: 'aptos', symbol: 'APT', name: 'Aptos' },
  { id: 'arbitrum', symbol: 'ARB', name: 'Arbitrum' },
  { id: 'optimism', symbol: 'OP', name: 'Optimism' },
  { id: 'filecoin', symbol: 'FIL', name: 'Filecoin' },
  { id: 'the-graph', symbol: 'GRT', name: 'The Graph' },
  { id: 'algorand', symbol: 'ALGO', name: 'Algorand' },
  { id: 'vechain', symbol: 'VET', name: 'VeChain' },
  { id: 'internet-computer', symbol: 'ICP', name: 'Internet Computer' },
];

const CURRENCY_OPTIONS = [
  // 주요 통화
  { id: 'USD', symbol: 'USD', name: '🇺🇸 미국 달러' },
  { id: 'EUR', symbol: 'EUR', name: '🇪🇺 유로' },
  { id: 'JPY', symbol: 'JPY', name: '🇯🇵 일본 엔' },
  { id: 'GBP', symbol: 'GBP', name: '🇬🇧 영국 파운드' },
  { id: 'CNY', symbol: 'CNY', name: '🇨🇳 중국 위안' },

  // 아시아
  { id: 'HKD', symbol: 'HKD', name: '🇭🇰 홍콩 달러' },
  { id: 'SGD', symbol: 'SGD', name: '🇸🇬 싱가포르 달러' },
  { id: 'TWD', symbol: 'TWD', name: '🇹🇼 대만 달러' },
  { id: 'THB', symbol: 'THB', name: '🇹🇭 태국 바트' },
  { id: 'INR', symbol: 'INR', name: '🇮🇳 인도 루피' },

  // 오세아니아
  { id: 'AUD', symbol: 'AUD', name: '🇦🇺 호주 달러' },
  { id: 'NZD', symbol: 'NZD', name: '🇳🇿 뉴질랜드 달러' },

  // 유럽
  { id: 'CHF', symbol: 'CHF', name: '🇨🇭 스위스 프랑' },
  { id: 'SEK', symbol: 'SEK', name: '🇸🇪 스웨덴 크로나' },
  { id: 'NOK', symbol: 'NOK', name: '🇳🇴 노르웨이 크로네' },
  { id: 'DKK', symbol: 'DKK', name: '🇩🇰 덴마크 크로네' },
  { id: 'PLN', symbol: 'PLN', name: '🇵🇱 폴란드 즐로티' },
  { id: 'CZK', symbol: 'CZK', name: '🇨🇿 체코 코루나' },
  { id: 'HUF', symbol: 'HUF', name: '🇭🇺 헝가리 포린트' },
  { id: 'RON', symbol: 'RON', name: '🇷🇴 루마니아 레우' },

  // 아메리카
  { id: 'CAD', symbol: 'CAD', name: '🇨🇦 캐나다 달러' },
  { id: 'MXN', symbol: 'MXN', name: '🇲🇽 멕시코 페소' },
  { id: 'BRL', symbol: 'BRL', name: '🇧🇷 브라질 헤알' },

  // 중동/아프리카
  { id: 'TRY', symbol: 'TRY', name: '🇹🇷 터키 리라' },
  { id: 'ZAR', symbol: 'ZAR', name: '🇿🇦 남아공 랜드' },
  { id: 'ILS', symbol: 'ILS', name: '🇮🇱 이스라엘 셰켈' },
];

export const SymbolSelectModal: React.FC<SymbolSelectModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  type,
}) => {
  const options = type === 'coins' ? COIN_OPTIONS : CURRENCY_OPTIONS;

  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([]);

  // 모달이 열릴 때마다 초기화
  useEffect(() => {
    if (isOpen) {
      setSelectedSymbols([]);
    }
  }, [isOpen, type]);

  if (!isOpen) return null;

  const toggleSymbol = (symbolId: string) => {
    setSelectedSymbols(prev => {
      if (prev.includes(symbolId)) {
        return prev.filter(s => s !== symbolId);
      } else {
        return [...prev, symbolId];
      }
    });
  };

  const handleConfirm = () => {
    if (selectedSymbols.length === 0) {
      alert('최소 1개 이상의 종목을 선택해주세요.');
      return;
    }
    onConfirm(selectedSymbols);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">
            {type === 'coins' ? '암호화폐 선택' : '환율 선택'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            표시할 종목을 선택하세요 (최대 20개 권장)
          </p>

          <div className="grid grid-cols-3 gap-2 max-h-96 overflow-y-auto pr-2">
            {options.map((option) => (
              <label
                key={option.id}
                className={`flex items-center gap-2 p-2 border rounded-lg cursor-pointer transition-colors ${
                  selectedSymbols.includes(option.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedSymbols.includes(option.id)}
                  onChange={() => toggleSymbol(option.id)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{option.symbol}</div>
                  <div className="text-xs text-gray-500 truncate">{option.name}</div>
                </div>
              </label>
            ))}
          </div>

          <div className="mt-4 text-sm text-gray-600">
            선택된 종목: {selectedSymbols.length}개
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

export default SymbolSelectModal;
