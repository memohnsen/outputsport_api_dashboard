"use client";

import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// Sample data for the line chart
const data = [
  { name: 'Jan', dataset1: 4000, dataset2: 2400 },
  { name: 'Feb', dataset1: 3000, dataset2: 1398 },
  { name: 'Mar', dataset1: 2000, dataset2: 3800 },
  { name: 'Apr', dataset1: 2780, dataset2: 3908 },
  { name: 'May', dataset1: 1890, dataset2: 4800 },
  { name: 'Jun', dataset1: 2390, dataset2: 3800 },
  { name: 'Jul', dataset1: 3490, dataset2: 4300 },
];

interface LineChartProps {
  title?: string;
}

export default function LineChart({ title = "Trend Analysis" }: LineChartProps) {
  return (
    <div className="w-full rounded-xl bg-white/5 p-6 backdrop-blur-sm">
      <h3 className="mb-4 text-xl font-semibold text-white">{title}</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsLineChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="name" stroke="#ccc" />
            <YAxis stroke="#ccc" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(50, 50, 50, 0.95)',
                borderColor: '#666',
                color: 'white'
              }} 
            />
            <Legend wrapperStyle={{ color: '#ccc' }} />
            <Line type="monotone" dataKey="dataset1" stroke="#8884d8" activeDot={{ r: 8 }} />
            <Line type="monotone" dataKey="dataset2" stroke="#82ca9d" />
          </RechartsLineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 