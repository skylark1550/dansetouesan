import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = ['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#f97316'];

export default function PortfolioChart({ holdings, companies }) {
  const chartData = holdings.map((holding, index) => {
    const company = companies.find(c => c.id === holding.company_id);
    return {
      name: company?.ticker || 'Unknown',
      value: holding.shares * (company?.current_price || 0),
      shares: holding.shares,
    };
  }).filter(item => item.value > 0);

  const totalValue = chartData.reduce((sum, item) => sum + item.value, 0);

  if (chartData.length === 0) {
    return (
      <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Portfolio Composition</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <p className="text-slate-400">No holdings yet. Start trading to see your portfolio!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
      <CardHeader>
        <CardTitle className="text-white">Portfolio Composition</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry) => `${entry.name} (${((entry.value / totalValue) * 100).toFixed(1)}%)`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
              labelStyle={{ color: '#fff' }}
              formatter={(value) => `${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Ð`}
            />
            <Legend 
              wrapperStyle={{ color: '#94a3b8' }}
            />
          </PieChart>
        </ResponsiveContainer>
        
        <div className="mt-6 grid grid-cols-2 gap-3">
          {chartData.map((item, index) => (
            <div 
              key={item.name} 
              className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                ></div>
                <span className="text-white font-semibold">{item.name}:</span>
              </div>
              <span className="text-emerald-400 font-bold">
                {((item.value / totalValue) * 100).toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
