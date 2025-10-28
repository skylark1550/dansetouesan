import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, DollarSign, Briefcase, Activity, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

import PortfolioChart from "../components/dashboard/PortfolioChart";
import MarketMovers from "../components/dashboard/MarketMovers";
import RecentTransactions from "../components/dashboard/RecentTransactions";

export default function Dashboard() {
  const [user, setUser] = useState(null);

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

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions', user?.email],
    queryFn: () => user ? base44.entities.Transaction.filter({ user_email: user.email }, '-created_date', 10) : [],
    enabled: !!user,
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

  const calculatePortfolioValue = () => {
    return holdings.reduce((total, holding) => {
      const company = companies.find(c => c.id === holding.company_id);
      if (!company) return total;
      return total + (holding.shares * company.current_price);
    }, 0);
  };

  const calculateTotalProfitLoss = () => {
    return holdings.reduce((total, holding) => {
      const company = companies.find(c => c.id === holding.company_id);
      if (!company) return total;
      const currentValue = holding.shares * company.current_price;
      return total + (currentValue - holding.total_invested);
    }, 0);
  };

  const portfolioValue = calculatePortfolioValue();
  const profitLoss = calculateTotalProfitLoss();
  const profitLossPercent = holdings.length > 0 
    ? ((profitLoss / holdings.reduce((sum, h) => sum + h.total_invested, 0)) * 100).toFixed(2) 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            Market Dashboard
          </h1>
          <p className="text-slate-400">Welcome to the Dänsétòuésän Stock Exchange</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800 hover:border-emerald-500/50 transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Cash Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold text-white">
                {(user?.cash_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Ð
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800 hover:border-cyan-500/50 transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Portfolio Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold text-white">
                {portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Ð
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800 hover:border-purple-500/50 transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Profit/Loss
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl md:text-3xl font-bold ${profitLoss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {profitLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Ð
              </div>
              <div className="flex items-center gap-1 mt-1">
                {profitLoss >= 0 ? (
                  <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-400" />
                )}
                <span className={`text-sm ${profitLoss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {profitLossPercent}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800 hover:border-orange-500/50 transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Holdings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold text-white">
                {holdings.length}
              </div>
              <p className="text-sm text-slate-400 mt-1">Active positions</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <PortfolioChart holdings={holdings} companies={companies} />
          </div>
          <div>
            <MarketMovers companies={companies} />
          </div>
        </div>

        <RecentTransactions transactions={transactions} />
      </div>
    </div>
  );
}
