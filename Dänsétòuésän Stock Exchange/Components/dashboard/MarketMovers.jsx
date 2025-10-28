import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function MarketMovers({ companies }) {
  const sortedCompanies = [...companies].sort((a, b) => {
    const changeA = ((a.current_price - a.initial_price) / a.initial_price) * 100;
    const changeB = ((b.current_price - b.initial_price) / b.initial_price) * 100;
    return Math.abs(changeB) - Math.abs(changeA);
  }).slice(0, 5);

  return (
    <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          Market Movers
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedCompanies.length === 0 ? (
          <p className="text-slate-400 text-sm">No companies listed yet</p>
        ) : (
          sortedCompanies.map((company) => {
            const change = ((company.current_price - company.initial_price) / company.initial_price) * 100;
            const isPositive = change >= 0;
            
            return (
              <div key={company.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{company.ticker}</span>
                    <Badge variant="outline" className="text-xs border-white text-white">
                      {company.sector}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">Ð {company.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className="text-right">
                  <div className={`flex items-center gap-1 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isPositive ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    <span className="font-semibold">{Math.abs(change).toFixed(2)}%</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
