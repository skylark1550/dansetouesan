import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Activity } from "lucide-react";

export default function LivePriceChart({ company }) {
  const generateMockData = () => {
    const data = [];
    const basePrice = company.initial_price;
    const currentPrice = company.current_price;
    const priceRange = currentPrice - basePrice;
    
    for (let i = 0; i < 20; i++) {
      const progress = i / 19;
      const noise = (Math.random() - 0.5) * (basePrice * 0.02);
      const price = basePrice + (priceRange * progress) + noise;
      
      data.push({
        time: `${i}m`,
        price: Math.max(0.01, price),
      });
    }
    
    data[data.length - 1].price = currentPrice;
    
    return data;
  };

  const data = generateMockData();

  return (
    <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Price Movement
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis 
              dataKey="time" 
              stroke="#94a3b8"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#94a3b8"
              style={{ fontSize: '12px' }}
              domain={['auto', 'auto']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#fff'
              }}
              formatter={(value) => [`${value.toFixed(2)} Ð`, 'Price']}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
