"use client";

import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface ChartViewProps {
  type: 'bar' | 'line' | 'pie' | 'area';
  data: any[];
  title?: string;
  units?: Record<string, string>;
  colors?: Record<string, string>;
}

const DEFAULT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const ChartView: React.FC<ChartViewProps> = ({ type, data, title, units = {}, colors = {} }) => {
  // 데이터 키에 맞는 색상 가져오기
  const getColor = (dataKey: string, index: number): string => {
    return colors[dataKey] || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
  };

  // 색상 정보를 CSS variables로 변환
  const colorStyles: React.CSSProperties = {};
  Object.entries(colors).forEach(([key, color]) => {
    // CSS variable 이름을 안전하게 만들기 (공백과 특수문자 제거)
    const safeName = key.replace(/[^a-zA-Z0-9가-힣]/g, '-');
    (colorStyles as any)[`--chart-color-${safeName}`] = color;
  });
  // 단위에 맞게 값 포맷팅
  const formatValue = (value: number, dataKey?: string): string => {
    const unit = dataKey ? (units[dataKey] || '') : '';

    // 단위가 없거나 'none'인 경우
    if (!unit || unit === 'none' || unit.trim() === '') {
      return value.toLocaleString();
    }

    // 사용자가 입력한 단위를 값 뒤에 붙임
    return `${value.toLocaleString()}${unit}`;
  };
  if (!data || data.length === 0) {
    return (
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
        <div className="text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-lg font-medium">차트 데이터 없음</p>
          <p className="text-sm mt-1">데이터를 추가해주세요</p>
        </div>
      </div>
    );
  }

  // 데이터 키 자동 감지
  const dataKeys = data.length > 0 ? Object.keys(data[0]).filter(key => key !== 'name' && key !== 'label') : [];
  const labelKey = data.length > 0 && 'name' in data[0] ? 'name' : 'label';

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={labelKey} />
              <YAxis />
              <Tooltip formatter={(value: number, name: string) => formatValue(value, name)} />
              <Legend />
              {dataKeys.map((key, index) => (
                <Bar key={key} dataKey={key} fill={getColor(key, index)} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={labelKey} />
              <YAxis />
              <Tooltip formatter={(value: number, name: string) => formatValue(value, name)} />
              <Legend />
              {dataKeys.map((key, index) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={getColor(key, index)}
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pie':
        // Pie 차트는 첫 번째 데이터 키만 사용
        const pieDataKey = dataKeys[0] || 'value';
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={data}
                dataKey={pieDataKey}
                nameKey={labelKey}
                cx="50%"
                cy="50%"
                outerRadius={120}
                label={(entry) => `${entry[labelKey]}: ${formatValue(entry[pieDataKey] as number, pieDataKey)}`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={DEFAULT_COLORS[index % DEFAULT_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number, name: string) => formatValue(value, name)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <defs>
                {dataKeys.map((key, index) => {
                  const color = getColor(key, index);
                  return (
                    <linearGradient key={key} id={`colorArea${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={color} stopOpacity={0}/>
                    </linearGradient>
                  );
                })}
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={labelKey} />
              <YAxis />
              <Tooltip formatter={(value: number, name: string) => formatValue(value, name)} />
              <Legend />
              {dataKeys.map((key, index) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={getColor(key, index)}
                  fillOpacity={1}
                  fill={`url(#colorArea${index})`}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="my-6 p-6 bg-white border border-gray-200 rounded-lg shadow-sm"
      style={colorStyles}
      data-chart-colors={JSON.stringify(colors)}
    >
      {title && (
        <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">{title}</h3>
      )}
      {renderChart()}
    </div>
  );
};

export default ChartView;
