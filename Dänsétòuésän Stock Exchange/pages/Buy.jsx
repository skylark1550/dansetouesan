import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrendingUp, TrendingDown, AlertCircle, DollarSign, ShoppingCart, Lock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Buy() {
  const [user, setUser] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
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

  const buyMutation = useMutation({
    mutationFn: async ({ company, shareCount }) => {
      const now = Date.now();
      if (now - lastTradeTime < 5000) {
        throw new Error("Please wait 5 seconds between trades");
      }

      const currentMarketStatus = marketStatus.length > 0 ? marketStatus[0] : { is_open: true };
      if (!currentMarketStatus.is_open) {
        throw new Error(currentMarketStatus.message || "Market is currently closed");
      }

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

      const impactPercent = (shareCount / company.total_shares) * 100;
      const priceImpact = company.current_price * (impactPercent / 100);
      const priceAfterImpact = company.current_price + priceImpact;
      
      // Use company's market_volatility for price fluctuations, default to 2.5% if not defined
      const volatility = company.market_volatility || 2.5;
      const marketNoisePercent = (Math.random() * (volatility * 2) - volatility) / 100; // Random change between -volatility% and +volatility%
      const marketNoise = priceAfterImpact * marketNoisePercent;
      const newPrice = Math.max(0.01, priceAfterImpact + marketNoise); // Ensure price doesn't go below 0.01
      
      await base44.entities.Company.update(company.id, {
        current_price: newPrice
      });

      setLastTradeTime(now);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holdings'] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setSuccess("Purchase successful!");
      setSelectedCompany(null);
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

  const handleBuy = () => {
    if (!selectedCompany || shares < 1) return;
    buyMutation.mutate({ company: selectedCompany, shareCount: shares });
  };

  const openBuyDialog = (company) => {
    setSelectedCompany(company);
    setShares(1);
    setError(null);
  };

  const getUserHolding = (companyId) => {
    return holdings.find(h => h.company_id === companyId);
  };

  const currentMarketStatus = marketStatus.length > 0 ? marketStatus[0] : { is_open: true };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            Buy Stocks
          </h1>
          <p className="text-slate-400">Purchase shares from available companies</p>
        </div>

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

        {!currentMarketStatus.is_open && (
          <Alert className="mb-6 bg-red-500/20 border-red-500">
            <Lock className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-200">
              {currentMarketStatus.message || "Market is currently closed for trading"}
            </AlertDescription>
          </Alert>
        )}

        <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              Available Cash: {user?.cash_balance?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'} Danset
            </CardTitle>
          </CardHeader>
        </Card>

        <div className="grid gap-6">
          {companies.length === 0 ? (
            <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
              <CardContent className="py-12">
                <p className="text-slate-400 text-center">No companies available for trading yet</p>
              </CardContent>
            </Card>
          ) : (
            companies.map((company) => {
              const holding = getUserHolding(company.id);
              const change = ((company.current_price - company.initial_price) / company.initial_price) * 100;
              const isPositive = change >= 0;

              return (
                <Card key={company.id} className="bg-slate-900/50 backdrop-blur-xl border-slate-800 hover:border-emerald-500/50 transition-all">
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
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500 text-sm">Current Price</span>
                            <span className="text-white font-bold">{company.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Danset</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500 text-sm">Change</span>
                            <div className={`flex items-center gap-1 font-semibold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                              {isPositive ? (
                                <TrendingUp className="w-4 h-4" />
                              ) : (
                                <TrendingDown className="w-4 h-4" />
                              )}
                              {Math.abs(change).toFixed(2)}%
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500 text-sm">Available Shares</span>
                            <span className="text-white">{company.available_shares.toLocaleString()}</span>
                          </div>
                        </div>
                        {holding && (
                          <div className="mt-2 text-sm text-cyan-400">
                            You own {holding.shares} shares (Avg: {holding.average_price.toFixed(2)} Danset)
                          </div>
                        )}
                      </div>
                      <Button
                        onClick={() => openBuyDialog(company)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2"
                        disabled={company.available_shares === 0 || !currentMarketStatus.is_open}
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Buy Shares
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        <Dialog open={!!selectedCompany} onOpenChange={() => setSelectedCompany(null)}>
          <DialogContent className="bg-slate-900 border-slate-800">
            <DialogHeader>
              <DialogTitle className="text-white">
                Buy {selectedCompany?.ticker}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <p className="text-slate-400 text-sm mb-1">Current Price</p>
                <p className="text-white text-2xl font-bold">{selectedCompany?.current_price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Danset</p>
              </div>
              <div>
                <label className="text-slate-400 text-sm block mb-2">Number of Shares</label>
                <Input
                  type="number"
                  min="1"
                  max={selectedCompany?.available_shares || 1}
                  value={shares}
                  onChange={(e) => setShares(parseInt(e.target.value) || 1)}
                  className="bg-slate-800 border-slate-700 text-white"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Max available: {selectedCompany?.available_shares}
                </p>
              </div>
              <div className="p-4 bg-slate-800/50 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-slate-400">Total Cost</span>
                  <span className="text-white font-bold">
                    {(shares * (selectedCompany?.current_price || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Danset
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Balance After</span>
                  <span className={`font-semibold ${
                    (user?.cash_balance || 0) - (shares * (selectedCompany?.current_price || 0)) < 0 
                      ? 'text-red-400' 
                      : 'text-emerald-400'
                  }`}>
                    {((user?.cash_balance || 0) - (shares * (selectedCompany?.current_price || 0))).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Danset
                  </span>
                </div>
              </div>
              <Alert className="bg-yellow-500/10 border-yellow-500/50">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <AlertDescription className="text-yellow-200 text-xs">
                  Market volatility: Price may fluctuate by up to {selectedCompany?.market_volatility || 2.5}% after your purchase.
                </AlertDescription>
              </Alert>
              <Button
                onClick={handleBuy}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={
                  buyMutation.isPending || 
                  (user?.cash_balance || 0) < (shares * (selectedCompany?.current_price || 0)) ||
                  !currentMarketStatus.is_open
                }
              >
                {buyMutation.isPending ? 'Processing...' : `Buy ${shares} Share${shares > 1 ? 's' : ''}`}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
