import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrendingUp, TrendingDown, Activity, Zap, AlertCircle, ArrowUpCircle, ArrowDownCircle, Lock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import LivePriceChart from "../components/trading/LivePriceChart";
import QuickTradePanel from "../components/trading/QuickTradePanel";
import OrderBook from "../components/trading/OrderBook";
import RecentTrades from "../components/trading/RecentTrades";

export default function Trading() {
  const [user, setUser] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [tradeType, setTradeType] = useState('buy');
  const [shares, setShares] = useState(1);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [lastTradeTime, setLastTradeTime] = useState(0); // New state for trade cooldown
  const queryClient = useQueryClient();

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.filter({ status: 'approved' }),
    initialData: [],
    refetchInterval: 5000,
  });

  const { data: holdings = [] } = useQuery({
    queryKey: ['holdings', user?.email],
    queryFn: () => user ? base44.entities.Holding.filter({ user_email: user.email }) : [],
    enabled: !!user,
    initialData: [],
  });

  const { data: recentTransactions = [] } = useQuery({
    queryKey: ['recent-transactions'],
    queryFn: () => base44.entities.Transaction.list('-created_date', 20),
    initialData: [],
    refetchInterval: 3000,
  });

  const { data: marketStatus = [] } = useQuery({ // New query for market status
    queryKey: ['market-status'],
    queryFn: () => base44.entities.MarketStatus.list(),
    initialData: [],
    refetchInterval: 5000, // Refresh market status periodically
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (companies.length > 0 && !selectedCompany) {
      setSelectedCompany(companies[0]);
    }
  }, [companies, selectedCompany]); // Added selectedCompany to dependency array

  const executeTradeMutation = useMutation({
    mutationFn: async ({ type, company, shareCount }) => {
      const now = Date.now();
      if (now - lastTradeTime < 5000) { // 5-second cooldown
        throw new Error("Please wait 5 seconds between trades");
      }

      const currentMarketStatus = marketStatus.length > 0 ? marketStatus[0] : { is_open: true };
      if (!currentMarketStatus.is_open) {
        throw new Error(currentMarketStatus.message || "Market is currently closed");
      }

      if (type === 'buy') {
        const totalCost = shareCount * company.current_price;
        if (user.cash_balance < totalCost) {
          throw new Error("Insufficient funds");
        }
        if (company.available_shares < shareCount) {
          throw new Error("Insufficient shares available");
        }

        await base44.auth.updateMe({
          cash_balance: user.cash_balance - totalCost
        });

        await base44.entities.Company.update(company.id, {
          available_shares: company.available_shares - shareCount
        });

        const existingHolding = holdings.find(h => h.company_id === company.id);
        if (existingHolding) {
          const newShares = existingHolding.shares + shareCount;
          const newTotalInvested = existingHolding.total_invested + totalCost;
          await base44.entities.Holding.update(existingHolding.id, {
            shares: newShares,
            average_price: newTotalInvested / newShares,
            total_invested: newTotalInvested
          });
        } else {
          await base44.entities.Holding.create({
            user_email: user.email,
            company_id: company.id,
            ticker: company.ticker,
            shares: shareCount,
            average_price: company.current_price,
            total_invested: totalCost
          });
        }

        await base44.entities.Transaction.create({
          user_email: user.email,
          company_id: company.id,
          ticker: company.ticker,
          type: 'buy',
          shares: shareCount,
          price_per_share: company.current_price,
          total_amount: totalCost
        });

        // New pricing system for buy
        const totalShares = company.total_shares || 1000000; // Use a default if total_shares is not defined
        const impactPercent = (shareCount / totalShares) * 100;
        const priceImpact = company.current_price * (impactPercent / 100); // Changed impact divisor from 1000 to 100
        const priceAfterImpact = company.current_price + priceImpact;

        const volatility = company.market_volatility || 2.5; // Use company-specific volatility or default
        const marketNoisePercent = (Math.random() * (volatility * 2) - volatility) / 100; // Dynamic noise based on volatility
        const marketNoise = priceAfterImpact * marketNoisePercent;
        const newPrice = Math.max(0.01, priceAfterImpact + marketNoise); // Ensure price doesn't go below 0.01

        await base44.entities.Company.update(company.id, {
          current_price: newPrice
        });
      } else { // type === 'sell'
        const holding = holdings.find(h => h.company_id === company.id);
        if (!holding || holding.shares < shareCount) {
          throw new Error("Insufficient shares to sell");
        }

        const totalRevenue = shareCount * company.current_price;

        await base44.auth.updateMe({
          cash_balance: user.cash_balance + totalRevenue
        });

        await base44.entities.Company.update(company.id, {
          available_shares: company.available_shares + shareCount
        });

        if (holding.shares === shareCount) {
          await base44.entities.Holding.delete(holding.id);
        } else {
          const newShares = holding.shares - shareCount;
          // Recalculate total invested to ensure average price is correct for remaining shares
          const newTotalInvested = holding.total_invested - (shareCount * holding.average_price);
          await base44.entities.Holding.update(holding.id, {
            shares: newShares,
            total_invested: newTotalInvested
          });
        }

        await base44.entities.Transaction.create({
          user_email: user.email,
          company_id: company.id,
          ticker: company.ticker,
          type: 'sell',
          shares: shareCount,
          price_per_share: company.current_price,
          total_amount: totalRevenue
        });

        // New pricing system for sell
        const totalShares = company.total_shares || 1000000; // Use a default if total_shares is not defined
        const impactPercent = (shareCount / totalShares) * 100;
        const priceImpact = company.current_price * (impactPercent / 100); // Changed impact divisor from 1000 to 100
        const priceAfterImpact = company.current_price - priceImpact;

        const volatility = company.market_volatility || 2.5; // Use company-specific volatility or default
        const marketNoisePercent = (Math.random() * (volatility * 2) - volatility) / 100; // Dynamic noise based on volatility
        const marketNoise = priceAfterImpact * marketNoisePercent;
        const newPrice = Math.max(0.01, priceAfterImpact + marketNoise); // Ensure price doesn't go below 0.01

        await base44.entities.Company.update(company.id, {
          current_price: newPrice
        });
      }

      setLastTradeTime(now); // Set last trade time after successful trade
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['holdings'] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['recent-transactions'] });
      setSuccess(`${variables.type === 'buy' ? 'Purchase' : 'Sale'} successful!`);
      setShares(1);
      setTimeout(() => setSuccess(null), 3000);

      const fetchUser = async () => {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      };
      fetchUser();
    },
    onError: (error) => {
      setError(error.message);
      setTimeout(() => setError(null), 5000);
    },
  });

  const handleQuickTrade = () => {
    if (!selectedCompany || shares < 1) return;
    executeTradeMutation.mutate({ type: tradeType, company: selectedCompany, shareCount: shares });
  };

  const getUserHolding = (companyId) => {
    return holdings.find(h => h.company_id === companyId);
  };

  // Determine market status for UI
  const currentMarketStatus = marketStatus.length > 0 ? marketStatus[0] : { is_open: true };

  if (!selectedCompany) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8 flex items-center justify-center">
        <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
          <CardContent className="py-12">
            <p className="text-slate-400 text-center">Loading trading floor...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const holding = getUserHolding(selectedCompany.id);
  const priceChange = ((selectedCompany.current_price - selectedCompany.initial_price) / selectedCompany.initial_price) * 100;
  const isPositive = priceChange >= 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-6">
      <div className="max-w-[1800px] mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-8 h-8 text-emerald-400" />
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Trading Floor
            </h1>
            <div className="flex items-center gap-2 ml-4">
              <div className={`w-2 h-2 rounded-full ${currentMarketStatus.is_open ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></div>
              <span className={`text-sm font-medium ${currentMarketStatus.is_open ? 'text-emerald-400' : 'text-red-400'}`}>
                {currentMarketStatus.is_open ? 'LIVE' : 'CLOSED'}
              </span>
            </div>
          </div>
          <p className="text-slate-400">Real-time trading on the Dänsétòuésän Stock Exchange</p>
        </div>

        {/* Market Closed Alert */}
        {!currentMarketStatus.is_open && (
          <Alert className="mb-4 bg-red-500/20 border-red-500">
            <Lock className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-200">
              {currentMarketStatus.message || "Market is currently closed for trading."}
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 bg-emerald-500/20 border-emerald-500 text-emerald-400">
            <Zap className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-3 gap-4 mb-4">
          <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-400">Cash Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">{user?.cash_balance?.toFixed(2) || '0.00'} Ð</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-400">Active Stocks</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">{companies.length}</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-400">Your Holdings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">{holdings.length}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-2xl text-white">{selectedCompany.ticker}</CardTitle>
                      <Badge variant="outline">{selectedCompany.sector}</Badge>
                      <div className={`flex items-center gap-1 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isPositive ? (
                          <ArrowUpCircle className="w-4 h-4" />
                        ) : (
                          <ArrowDownCircle className="w-4 h-4" />
                        )}
                        <span className="font-semibold">{Math.abs(priceChange).toFixed(2)}%</span>
                      </div>
                    </div>
                    <p className="text-slate-400 mt-1">{selectedCompany.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-white">{selectedCompany.current_price.toFixed(2)} Ð</p>
                    <p className="text-sm text-slate-400">Current Price</p>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Select Stock</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {companies.map((company) => {
                    const change = ((company.current_price - company.initial_price) / company.initial_price) * 100;
                    const positive = change >= 0;
                    return (
                      <button
                        key={company.id}
                        onClick={() => setSelectedCompany(company)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          selectedCompany?.id === company.id
                            ? 'border-emerald-500 bg-emerald-500/10'
                            : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                        }`}
                      >
                        <div className="text-left">
                          <p className="font-bold text-white">{company.ticker}</p>
                          <p className="text-sm text-slate-400">{company.current_price.toFixed(2)} Ð</p>
                          <p className={`text-xs font-semibold ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
                            {positive ? '+' : ''}{change.toFixed(2)}%
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <LivePriceChart company={selectedCompany} />
            <OrderBook company={selectedCompany} />
          </div>

          <div className="space-y-4">
            <QuickTradePanel
              company={selectedCompany}
              user={user}
              holding={holding}
              tradeType={tradeType}
              setTradeType={setTradeType}
              shares={shares}
              setShares={setShares}
              onExecute={handleQuickTrade}
              isLoading={executeTradeMutation.isPending}
            />
            <RecentTrades transactions={recentTransactions} />
          </div>
        </div>
      </div>
    </div>
  );
}
