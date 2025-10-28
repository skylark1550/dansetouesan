import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";
import { format } from "date-fns";

export default function RecentTrades({ transactions }) {
  return (
    <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Live Feed
        </CardTitle>
      </CardHeader>
      <CardContent className="max-h-[600px] overflow-y-auto">
        {transactions.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">No recent trades</p>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div key={tx.id} className="p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-white">{tx.ticker}</span>
                  <Badge className={tx.type === 'buy' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}>
                    {tx.type.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>{tx.shares} shares @ {tx.price_per_share.toFixed(2)} Ð</span>
                  <span>{format(new Date(tx.created_date), 'HH:mm:ss')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
