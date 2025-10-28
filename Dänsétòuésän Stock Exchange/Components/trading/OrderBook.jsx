import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Book } from "lucide-react";

export default function OrderBook({ company }) {
  const generateOrderBook = () => {
    const buyOrders = [];
    const sellOrders = [];
    const basePrice = company.current_price;

    for (let i = 0; i < 5; i++) {
      buyOrders.push({
        price: (basePrice - (i + 1) * 0.1).toFixed(2),
        shares: Math.floor(Math.random() * 500) + 100,
      });

      sellOrders.push({
        price: (basePrice + (i + 1) * 0.1).toFixed(2),
        shares: Math.floor(Math.random() * 500) + 100,
      });
    }

    return { buyOrders, sellOrders };
  };

  const { buyOrders, sellOrders } = generateOrderBook();

  return (
    <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Book className="w-5 h-5" />
          Market Depth
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-semibold text-emerald-400 mb-3">Buy Orders</h3>
            <div className="space-y-2">
              {buyOrders.map((order, i) => (
                <div key={i} className="flex justify-between text-sm p-2 bg-emerald-500/5 rounded">
                  <span className="text-emerald-400 font-mono">{order.price} Ð</span>
                  <span className="text-slate-400">{order.shares}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-red-400 mb-3">Sell Orders</h3>
            <div className="space-y-2">
              {sellOrders.map((order, i) => (
                <div key={i} className="flex justify-between text-sm p-2 bg-red-500/5 rounded">
                  <span className="text-red-400 font-mono">{order.price} Ð</span>
                  <span className="text-slate-400">{order.shares}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
