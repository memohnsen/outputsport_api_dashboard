"use client";

import { ResponsivePie } from '@nivo/pie';

// Sample data for the pie chart
const data = [
  {
    id: 'Product A',
    label: 'Product A',
    value: 35,
    color: 'hsl(104, 70%, 50%)',
  },
  {
    id: 'Product B',
    label: 'Product B',
    value: 25,
    color: 'hsl(291, 70%, 50%)',
  },
  {
    id: 'Product C',
    label: 'Product C',
    value: 20,
    color: 'hsl(229, 70%, 50%)',
  },
  {
    id: 'Product D',
    label: 'Product D',
    value: 15,
    color: 'hsl(344, 70%, 50%)',
  },
  {
    id: 'Product E',
    label: 'Product E',
    value: 5,
    color: 'hsl(162, 70%, 50%)',
  },
];

interface PieChartProps {
  title?: string;
}

export default function PieChart({ title = "Market Distribution" }: PieChartProps) {
  return (
    <div className="w-full rounded-xl bg-white/5 p-6 backdrop-blur-sm">
      <h3 className="mb-4 text-xl font-semibold text-white">{title}</h3>
      <div className="h-64 w-full">
        <ResponsivePie
          data={data}
          margin={{ top: 10, right: 20, bottom: 40, left: 20 }}
          innerRadius={0.5}
          padAngle={0.7}
          cornerRadius={3}
          activeOuterRadiusOffset={8}
          borderWidth={1}
          borderColor={{
            from: 'color',
            modifiers: [['darker', 0.2]],
          }}
          arcLinkLabelsSkipAngle={10}
          arcLinkLabelsTextColor="#ccc"
          arcLinkLabelsThickness={2}
          arcLinkLabelsColor={{ from: 'color' }}
          arcLabelsSkipAngle={10}
          arcLabelsTextColor={{
            from: 'color',
            modifiers: [['darker', 2]],
          }}
          colors={{ scheme: 'purple_blue' }}
          theme={{
            text: {
              fill: '#ccc',
            },
            tooltip: {
              container: {
                background: 'rgba(50, 50, 50, 0.95)',
                color: 'white',
              },
            },
          }}
        />
      </div>
    </div>
  );
} 