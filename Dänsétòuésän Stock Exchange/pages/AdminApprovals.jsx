import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, Building2, AlertCircle, Trash2, Lock, Unlock } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import ManageUsers from "../components/admin/ManageUsers";
import AddCompanyForm from "../components/admin/AddCompanyForm";
import MarketScheduleManager from "../components/admin/MarketScheduleManager";
import NewsPublisher from "../components/admin/NewsPublisher";

export default function AdminApprovals() {
  const [user, setUser] = useState(null);
  const [marketMessage, setMarketMessage] = useState("");
  const [generatedReport, setGeneratedReport] = useState("");
  const queryClient = useQueryClient();

  const { data: pendingCompanies = [] } = useQuery({
    queryKey: ['pending-companies'],
    queryFn: () => base44.entities.Company.filter({ status: 'pending' }),
    initialData: [],
  });

  const { data: allCompanies = [] } = useQuery({
    queryKey: ['all-companies'],
    queryFn: () => base44.entities.Company.list('-created_date'),
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

  useEffect(() => {
    if (marketStatus.length > 0) {
      setMarketMessage(marketStatus[0].message || "");
    }
  }, [marketStatus]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ companyId, status }) => {
      return await base44.entities.Company.update(companyId, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-companies'] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['all-companies'] });
    },
  });

  const deleteCompanyMutation = useMutation({
    mutationFn: async (companyId) => {
      return await base44.entities.Company.delete(companyId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-companies'] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['all-companies'] });
    },
  });

  const updateCompanyMutation = useMutation({
    mutationFn: async ({ companyId, data }) => {
      return await base44.entities.Company.update(companyId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-companies'] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });

  const toggleMarketMutation = useMutation({
    mutationFn: async ({ isOpen, message }) => {
      if (!isOpen) {
        await Promise.all(
          allCompanies.map(company => 
            base44.entities.Company.update(company.id, {
              initial_price: company.current_price
            })
          )
        );
      }
      
      if (marketStatus.length === 0) {
        return await base44.entities.MarketStatus.create({ is_open: isOpen, message });
      } else {
        return await base44.entities.MarketStatus.update(marketStatus[0].id, { is_open: isOpen, message });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-status'] });
      queryClient.invalidateQueries({ queryKey: ['all-companies'] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });

  const generateReport = () => {
    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getFullYear()).slice(2)}`;
    const timeStr = `${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')} UTC`;
    
    let report = `Dänsétòuésän Stock Exchange Prices\nUpdated as of ${timeStr}, ${dateStr}\n\n`;
    
    allCompanies.forEach(company => {
      const change = ((company.current_price - company.initial_price) / company.initial_price) * 100;
      const emoji = change >= 0 ? '📈' : '📉';
      report += `${company.name} (${company.ticker}): Ð${company.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${change.toFixed(2)}% ${emoji})\n`;
    });
    
    report += `\nThe Dänsétòuésän Stock Exchange will be opened the following day on [DATE] at [TIME UTC - TIME SGT] and will close at [TIME UTC - TIME SGT]`;
    
    setGeneratedReport(report);
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8 flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>You need admin privileges to access this page</AlertDescription>
        </Alert>
      </div>
    );
  }

  const currentMarketStatus = marketStatus.length > 0 ? marketStatus[0] : { is_open: true };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            Admin Control Panel
          </h1>
          <p className="text-slate-400">Manage companies, users, news, and exchange settings</p>
        </div>

        <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              {currentMarketStatus.is_open ? (
                <Unlock className="w-5 h-5 text-emerald-400" />
              ) : (
                <Lock className="w-5 h-5 text-red-400" />
              )}
              Market Status Control
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Label htmlFor="market-toggle" className="text-white font-medium">
                  Market is {currentMarketStatus.is_open ? 'Open' : 'Closed'}
                </Label>
                <Badge className={currentMarketStatus.is_open ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}>
                  {currentMarketStatus.is_open ? 'TRADING' : 'MAINTENANCE'}
                </Badge>
              </div>
              <Switch
                id="market-toggle"
                checked={currentMarketStatus.is_open}
                onCheckedChange={(checked) => {
                  toggleMarketMutation.mutate({ isOpen: checked, message: marketMessage });
                }}
              />
            </div>
            <div>
              <Label htmlFor="market-message" className="text-slate-300 mb-2 block">
                Status Message (shown to traders)
              </Label>
              <Textarea
                id="market-message"
                value={marketMessage}
                onChange={(e) => setMarketMessage(e.target.value)}
                placeholder="e.g., Market closed for maintenance. Will reopen at 10:00 AM"
                className="bg-slate-800 border-slate-700 text-white"
              />
              <Button
                onClick={() => toggleMarketMutation.mutate({ isOpen: currentMarketStatus.is_open, message: marketMessage })}
                className="mt-2 bg-cyan-600 hover:bg-cyan-700"
                size="sm"
              >
                Update Message
              </Button>
            </div>
            <Alert className="bg-yellow-500/10 border-yellow-500/50">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <AlertDescription className="text-yellow-200 text-sm">
                Note: When you close the market, all current prices will become the new baseline for percentage calculations.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <MarketScheduleManager />

        <NewsPublisher />

        <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Generate Market Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={generateReport}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Generate Report
            </Button>
            {generatedReport && (
              <div className="p-4 bg-slate-800/50 rounded-lg">
                <pre className="text-slate-300 text-sm whitespace-pre-wrap font-mono">
                  {generatedReport}
                </pre>
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedReport);
                  }}
                  variant="outline"
                  size="sm"
                  className="mt-4"
                >
                  Copy to Clipboard
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <AddCompanyForm onSuccess={() => queryClient.invalidateQueries({ queryKey: ['all-companies'] })} />

        <ManageUsers />

        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Pending Company Approvals</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {pendingCompanies.length === 0 ? (
              <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800 col-span-full">
                <CardContent className="py-12">
                  <p className="text-slate-400 text-center">No pending approvals</p>
                </CardContent>
              </Card>
            ) : (
              pendingCompanies.map((company) => (
                <Card key={company.id} className="bg-slate-900/50 backdrop-blur-xl border-slate-800 hover:border-yellow-500/50 transition-all">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-white text-lg">{company.ticker}</CardTitle>
                          <Badge className="mt-1 bg-yellow-500/20 text-yellow-400">
                            Pending
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-white mb-2">{company.name}</h3>
                      <p className="text-slate-400 text-sm mb-3">{company.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-slate-500">Sector</span>
                        <p className="text-white font-medium">{company.sector}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Initial Price</span>
                        <p className="text-white font-medium">{company.initial_price.toFixed(2)} Ð</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Total Shares</span>
                        <p className="text-white font-medium">{company.total_shares.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Submitted By</span>
                        <p className="text-white font-medium truncate">{company.created_by}</p>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={() => updateStatusMutation.mutate({ companyId: company.id, status: 'approved' })}
                        disabled={updateStatusMutation.isPending}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => deleteCompanyMutation.mutate(company.id)}
                        disabled={deleteCompanyMutation.isPending}
                        variant="outline"
                        className="flex-1 border-red-600 text-red-400 hover:bg-red-600/20"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-white mb-4">All Companies</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allCompanies.map((company) => (
              <Card key={company.id} className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-white text-base">{company.ticker}</CardTitle>
                        <Badge className={
                          company.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                          company.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }>
                          {company.status}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteCompanyMutation.mutate(company.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm">
                    <span className="text-slate-500">Price: </span>
                    <span className="text-white font-semibold">{company.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Ð</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-slate-500">Available: </span>
                    <span className="text-white">{company.available_shares.toLocaleString()}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-slate-500">Volatility: </span>
                    <span className="text-white">{company.market_volatility || 2.5}%</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        const newPrice = prompt(`Set new price for ${company.ticker}:`, company.current_price.toString());
                        if (newPrice && !isNaN(newPrice) && parseFloat(newPrice) > 0) {
                          updateCompanyMutation.mutate({
                            companyId: company.id,
                            data: {
                              current_price: parseFloat(newPrice)
                            }
                          });
                        }
                      }}
                    >
                      Set Price
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        const newVolatility = prompt(`Set volatility % for ${company.ticker}:`, (company.market_volatility || 2.5).toString());
                        if (newVolatility && !isNaN(newVolatility) && parseFloat(newVolatility) >= 0) {
                          updateCompanyMutation.mutate({
                            companyId: company.id,
                            data: {
                              market_volatility: parseFloat(newVolatility)
                            }
                          });
                        }
                      }}
                    >
                      Set Volatility
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      const newShares = prompt(`Add shares to ${company.ticker}:`, "100");
                      if (newShares && !isNaN(newShares)) {
                        updateCompanyMutation.mutate({
                          companyId: company.id,
                          data: {
                            available_shares: company.available_shares + parseInt(newShares),
                            total_shares: company.total_shares + parseInt(newShares)
                          }
                        });
                      }
                    }}
                  >
                    Add Shares
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
