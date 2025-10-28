import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Zap } from "lucide-react";

export default function QuickTradePanel({ company, user, holding, tradeType, setTradeType, shares, setShares, onExecute, isLoading }) {
  const totalCost = shares * company.current_price;
  const totalRevenue = shares * company.current_price;
  const canBuy = user && user.cash_balance >= totalCost && company.available_shares >= shares;
  const canSell = holding && holding.shares >= shares;

  return (
    <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800 sticky top-4">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          Quick Trade
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={tradeType} onValueChange={setTradeType}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="buy" className="data-[state=active]:bg-emerald-600">
              <TrendingUp className="w-4 h-4 mr-2" />
              Buy
            </TabsTrigger>
            <TabsTrigger value="sell" className="data-[state=active]:bg-red-600">
              <TrendingDown className="w-4 h-4 mr-2" />
              Sell
            </TabsTrigger>
          </TabsList>

          <TabsContent value="buy" className="space-y-4 mt-4">
            <div>
              <label className="text-sm text-slate-400 block mb-2">Shares</label>
              <Input
                type="number"
                min="1"
                max={company.available_shares}
                value={shares}
                onChange={(e) => setShares(parseInt(e.target.value) || 1)}
                className="bg-slate-800 border-slate-700 text-white"
              />
              <p className="text-xs text-slate-500 mt-1">Available: {company.available_shares}</p>
            </div>

            <div className="p-3 bg-slate-800/50 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Price per share</span>
                <span className="text-white font-semibold">{company.current_price.toFixed(2)} Ð</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Total cost</span>
                <span className="text-white font-bold">{totalCost.toFixed(2)} Ð</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-slate-700">
                <span className="text-slate-400">Balance after</span>
                <span className={`font-semibold ${canBuy ? 'text-emerald-400' : 'text-red-400'}`}>
                  {((user?.cash_balance || 0) - totalCost).toFixed(2)} Ð
                </span>
              </div>
            </div>

            <Button
              onClick={onExecute}
              disabled={!canBuy || isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              {isLoading ? 'Executing...' : `Buy ${shares} Share${shares > 1 ? 's' : ''}`}
            </Button>
          </TabsContent>

          <TabsContent value="sell" className="space-y-4 mt-4">
            <div>
              <label className="text-sm text-slate-400 block mb-2">Shares</label>
              <Input
                type="number"
                min="1"
                max={holding?.shares || 0}
                value={shares}
                onChange={(e) => setShares(parseInt(e.target.value) || 1)}
                className="bg-slate-800 border-slate-700 text-white"
              />
              <p className="text-xs text-slate-500 mt-1">You own: {holding?.shares || 0}</p>
            </div>

            <div className="p-3 bg-slate-800/50 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Price per share</span>
                <span className="text-white font-semibold">{company.current_price.toFixed(2)} Ð</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Total revenue</span>
                <span className="text-white font-bold">{totalRevenue.toFixed(2)} Ð</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-slate-700">
                <span className="text-slate-400">Balance after</span>
                <span className="font-semibold text-emerald-400">
                  {((user?.cash_balance || 0) + totalRevenue).toFixed(2)} Ð
                </span>
              </div>
            </div>

            <Button
              onClick={onExecute}
              disabled={!canSell || isLoading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              {isLoading ? 'Executing...' : `Sell ${shares} Share${shares > 1 ? 's' : ''}`}
            </Button>
          </TabsContent>
        </Tabs>

        {holding && (
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
            <p className="text-xs text-cyan-400 font-medium mb-1">Your Position</p>
            <p className="text-sm text-white">
              {holding.shares} shares @ {holding.average_price.toFixed(2)} Ð avg
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Total invested: {holding.total_invested.toFixed(2)} Ð
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
