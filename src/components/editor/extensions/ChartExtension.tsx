import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React from 'react';
import ChartView from '../ChartView';

// React Component for the Node View
const ChartComponent = ({ node }: { node: any }) => {
  return (
    <NodeViewWrapper className="chart-wrapper">
      <ChartView
        type={node.attrs.chartType}
        data={node.attrs.data}
        title={node.attrs.title}
        units={node.attrs.units}
        colors={node.attrs.colors}
      />
    </NodeViewWrapper>
  );
};

// TypeScript 타입 선언
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    chart: {
      insertChart: (attributes?: {
        chartType?: 'bar' | 'line' | 'pie' | 'area';
        data?: any[];
        title?: string;
      }) => ReturnType;
    };
  }
}

// TipTap Extension
export const ChartExtension = Node.create({
  name: 'chart',

  group: 'block',

  atom: true,

  draggable: true,

  addAttributes() {
    return {
      chartType: {
        default: 'bar',
        parseHTML: element => element.getAttribute('data-chart-type'),
        renderHTML: attributes => {
          return {
            'data-chart-type': attributes.chartType,
          };
        },
      },
      data: {
        default: [],
        parseHTML: element => {
          const dataStr = element.getAttribute('data-chart-data');
          return dataStr ? JSON.parse(dataStr) : [];
        },
        renderHTML: attributes => {
          if (!attributes.data || attributes.data.length === 0) return {};
          return {
            'data-chart-data': JSON.stringify(attributes.data),
          };
        },
      },
      title: {
        default: '',
        parseHTML: element => element.getAttribute('data-chart-title'),
        renderHTML: attributes => {
          return {
            'data-chart-title': attributes.title || '',
          };
        },
      },
      units: {
        default: {},
        parseHTML: element => {
          const unitsStr = element.getAttribute('data-units');
          return unitsStr ? JSON.parse(unitsStr) : {};
        },
        renderHTML: attributes => {
          if (!attributes.units || Object.keys(attributes.units).length === 0) return {};
          return {
            'data-units': JSON.stringify(attributes.units),
          };
        },
      },
      colors: {
        default: {},
        parseHTML: element => {
          const colorsStr = element.getAttribute('data-colors');
          return colorsStr ? JSON.parse(colorsStr) : {};
        },
        renderHTML: attributes => {
          if (!attributes.colors || Object.keys(attributes.colors).length === 0) return {};
          return {
            'data-colors': JSON.stringify(attributes.colors),
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="chart"]',
        getAttrs: (element) => {
          if (typeof element === 'string') return false;
          const dataStr = element.getAttribute('data-chart-data');
          const unitsStr = element.getAttribute('data-units');
          const colorsStr = element.getAttribute('data-colors');
          return {
            chartType: element.getAttribute('data-chart-type') || 'bar',
            data: dataStr ? JSON.parse(dataStr) : [],
            title: element.getAttribute('data-chart-title') || '',
            units: unitsStr ? JSON.parse(unitsStr) : {},
            colors: colorsStr ? JSON.parse(colorsStr) : {},
          };
        },
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    // node.attrs에서 실제 속성 값 가져오기
    const chartType = node.attrs.chartType;
    const data = node.attrs.data;
    const title = node.attrs.title;
    const units = node.attrs.units;
    const colors = node.attrs.colors;

    console.log('🎨 Chart renderHTML 호출:', {
      chartType,
      dataLength: data?.length,
      title,
      units,
      colors,
      nodeAttrs: node.attrs,
      HTMLAttributes
    });

    const attrs: Record<string, any> = {
      'data-type': 'chart',
      'data-chart-type': chartType || 'bar',
      'data-chart-title': title || '',
    };

    if (data && data.length > 0) {
      attrs['data-chart-data'] = JSON.stringify(data);
    }

    if (units && Object.keys(units).length > 0) {
      attrs['data-units'] = JSON.stringify(units);
    }

    if (colors && Object.keys(colors).length > 0) {
      attrs['data-colors'] = JSON.stringify(colors);
    }

    console.log('✅ Chart 최종 attributes:', attrs);

    return [
      'div',
      attrs,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ChartComponent);
  },

  addCommands() {
    return {
      insertChart:
        (attrs?: { chartType?: 'bar' | 'line' | 'pie' | 'area'; data?: any[]; title?: string; units?: Record<string, string>; colors?: Record<string, string> }) =>
        ({ commands }) => {
          console.log('🚀 insertChart 커맨드 실행:', {
            receivedChartType: attrs?.chartType,
            finalChartType: attrs?.chartType || 'bar',
            dataLength: attrs?.data?.length || 0,
            title: attrs?.title,
            units: attrs?.units,
            colors: attrs?.colors
          });

          // 차트와 빈 문단을 함께 삽입하여 커서가 다음 줄로 이동하도록 함
          return commands.insertContent([
            {
              type: this.name,
              attrs: {
                chartType: attrs?.chartType || 'bar',
                data: attrs?.data || [],
                title: attrs?.title || '',
                units: attrs?.units || {},
                colors: attrs?.colors || {},
              },
            },
            {
              type: 'paragraph',
            },
          ]);
        },
    };
  },
});

export default ChartExtension;
