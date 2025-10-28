import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrendingUp, TrendingDown, AlertCircle, Wallet, DollarSign, Lock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Sell() {
  const [user, setUser] = useState(null);
  const [selectedHolding, setSelectedHolding] = useState(null);
  const [shares, setShares] = useState(1);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [lastTradeTime, setLastTradeTime] = useState(0);
  const queryClient = useQueryClient();

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.filter({ status: 'approved' }),
    initialData: [],
  });

  const { data: holdings = [] } = useQuery({
    queryKey: ['holdings', user?.email],
    queryFn: () => user ? base44.entities.Holding.filter({ user_email: user.email }) : [],
    enabled: !!user,
    initialData: [],
  });

  const { data: marketStatus = [] } = useQuery({
    queryKey: ['market-status'],
    queryFn: () => base44.entities.MarketStatus.list(),
    initialData: [],
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

  const sellMutation = useMutation({
    mutationFn: async ({ holding, company, shareCount }) => {
      const now = Date.now();
      if (now - lastTradeTime < 5000) {
        throw new Error("Please wait 5 seconds between trades");
      }

      const currentMarketStatus = marketStatus.length > 0 ? marketStatus[0] : { is_open: true };
      if (!currentMarketStatus.is_open) {
        throw new Error(currentMarketStatus.message || "Market is currently closed");
      }

      const totalRevenue = shareCount * company.current_price;

      if (holding.shares < shareCount) {
        throw new Error("Insufficient shares to sell");
      }

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

      const impactPercent = (shareCount / company.total_shares) * 100;
      const priceImpact = company.current_price * (impactPercent / 100);
      const priceAfterImpact = company.current_price - priceImpact;
      
      // Use company's market_volatility or default to 2.5
      const volatility = company.market_volatility || 2.5; 
      const marketNoisePercent = (Math.random() * (volatility * 2) - volatility) / 100;
      const marketNoise = priceAfterImpact * marketNoisePercent;
      const newPrice = Math.max(0.01, priceAfterImpact + marketNoise);
      
      await base44.entities.Company.update(company.id, {
        current_price: newPrice
      });

      setLastTradeTime(now);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holdings'] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['market-status'] });
      setSuccess("Sale successful!");
      setSelectedHolding(null);
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

  const handleSell = () => {
    if (!selectedHolding || shares < 1) return;
    const company = companies.find(c => c.id === selectedHolding.company_id);
    if (!company) {
      setError("Company not found");
      return;
    }
    sellMutation.mutate({ holding: selectedHolding, company, shareCount: shares });
  };

  const openSellDialog = (holding) => {
    setSelectedHolding(holding);
    setShares(1);
    setError(null);
  };

  const getCompanyForHolding = (holding) => {
    return companies.find(c => c.id === holding.company_id);
  };

  const calculateProfitLoss = (holding, company) => {
    if (!company) return { amount: 0, percent: 0 };
    const currentValue = holding.shares * company.current_price;
    const profitLoss = currentValue - holding.total_invested;
    const percent = holding.total_invested > 0 ? (profitLoss / holding.total_invested) * 100 : 0;
    return { amount: profitLoss, percent };
  };

  const currentMarketStatus = marketStatus.length > 0 ? marketStatus[0] : { is_open: true, message: "Market is closed" };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            Sell Stocks
          </h1>
          <p className="text-slate-400">Sell shares from your portfolio</p>
        </div>

        {!currentMarketStatus.is_open && (
          <Alert className="mb-6 bg-red-500/20 border-red-500">
            <Lock className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-200">
              {currentMarketStatus.message || "Market is currently closed for trading"}
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 bg-emerald-500/20 border-emerald-500 text-emerald-400">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              Current Balance: {user?.cash_balance?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'} Danset
            </CardTitle>
          </CardHeader>
        </Card>

        <div className="grid gap-6">
          {holdings.length === 0 ? (
            <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
              <CardContent className="py-12">
                <div className="text-center">
                  <Wallet className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 mb-2">You don't own any shares yet</p>
                  <p className="text-slate-500 text-sm">Visit the Buy page to start investing</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            holdings.map((holding) => {
              const company = getCompanyForHolding(holding);
              if (!company) return null;

              const { amount: profitLoss, percent: profitLossPercent } = calculateProfitLoss(holding, company);
              const isProfitable = profitLoss >= 0;
              const currentValue = holding.shares * company.current_price;

              return (
                <Card key={holding.id} className="bg-slate-900/50 backdrop-blur-xl border-slate-800 hover:border-red-500/50 transition-all">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-white">{company.ticker}</h3>
                          <Badge variant="outline" className="text-xs">
                            {company.sector}
                          </Badge>
                        </div>
                        <p className="text-slate-400 mb-3">{company.name}</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <span className="text-slate-500 block">Shares Owned</span>
                            <span className="text-white font-semibold">{holding.shares.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Avg. Price</span>
                            <span className="text-white font-semibold">{holding.average_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Danset</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Current Price</span>
                            <span className="text-white font-semibold">{company.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Danset</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Total Value</span>
                            <span className="text-white font-semibold">{currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Danset</span>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <span className="text-slate-500 text-sm">Profit/Loss:</span>
                          <div className={`flex items-center gap-1 ${isProfitable ? 'text-emerald-400' : 'text-red-400'}`}>
                            {isProfitable ? (
                              <TrendingUp className="w-4 h-4" />
                            ) : (
                              <TrendingDown className="w-4 h-4" />
                            )}
                            <span className="font-semibold">
                              {profitLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Danset ({profitLossPercent.toFixed(2)}%)
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => openSellDialog(holding)}
                        variant="outline"
                        className="border-red-600 text-red-400 hover:bg-red-600/20 flex items-center gap-2"
                        disabled={!currentMarketStatus.is_open}
                      >
                        <Wallet className="w-4 h-4" />
                        Sell Shares
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        <Dialog open={!!selectedHolding} onOpenChange={() => setSelectedHolding(null)}>
          <DialogContent className="bg-slate-900 border-slate-800">
            <DialogHeader>
              <DialogTitle className="text-white">
                Sell {selectedHolding ? getCompanyForHolding(selectedHolding)?.ticker : ''}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {selectedHolding && (() => {
                const company = getCompanyForHolding(selectedHolding);
                // Determine the volatility to display in the UI
                const displayVolatility = company?.market_volatility || 2.5;

                return (
                  <>
                    <div>
                      <p className="text-slate-400 text-sm mb-1">Current Price</p>
                      <p className="text-white text-2xl font-bold">{company?.current_price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Danset</p>
                    </div>
                    <div>
                      <label className="text-slate-400 text-sm block mb-2">Number of Shares to Sell</label>
                      <Input
                        type="number"
                        min="1"
                        max={selectedHolding.shares}
                        value={shares}
                        onChange={(e) => setShares(parseInt(e.target.value) || 1)}
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        You own: {selectedHolding.shares.toLocaleString()} shares
                      </p>
                    </div>
                    <div className="p-4 bg-slate-800/50 rounded-lg">
                      <div className="flex justify-between mb-2">
                        <span className="text-slate-400">Total Revenue</span>
                        <span className="text-white font-bold">
                          {(shares * (company?.current_price || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Danset
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Balance After</span>
                        <span className="font-semibold text-emerald-400">
                          {((user?.cash_balance || 0) + (shares * (company?.current_price || 0))).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Danset
                        </span>
                      </div>
                    </div>
                    <Alert className="bg-yellow-500/10 border-yellow-500/50">
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      <AlertDescription className="text-yellow-200 text-xs">
                        Market volatility: Price may fluctuate by plus or minus {displayVolatility} percent after your sale
                      </AlertDescription>
                    </Alert>
                    <Button
                      onClick={handleSell}
                      className="w-full bg-red-600 hover:bg-red-700"
                      disabled={sellMutation.isPending || !currentMarketStatus.is_open}
                    >
                      {sellMutation.isPending ? 'Processing...' : `Sell ${shares} Share${shares > 1 ? 's' : ''}`}
                    </Button>
                  </>
                );
              })()}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
