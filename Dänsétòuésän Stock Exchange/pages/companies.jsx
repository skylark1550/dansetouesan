import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Plus, TrendingUp, TrendingDown, Pencil } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

export default function Companies() {
  const [user, setUser] = useState(null);
  const [editingCompanyId, setEditingCompanyId] = useState(null);
  const [editedPrice, setEditedPrice] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list('-created_date'),
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

  const updatePriceMutation = useMutation({
    mutationFn: async ({ companyId, newPrice }) => {
      const priceValue = parseFloat(newPrice);
      if (isNaN(priceValue) || priceValue <= 0) {
        throw new Error("Invalid price value. Must be a positive number.");
      }
      return base44.entities.Company.update(companyId, { current_price: priceValue });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Company price updated successfully.",
        variant: "success",
      });
      queryClient.invalidateQueries(['companies']);
      setEditingCompanyId(null);
      setEditedPrice("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update company price.",
        variant: "destructive",
      });
    },
  });

  const approvedCompanies = companies.filter(c => c.status === 'approved');
  const pendingCompanies = companies.filter(c => c.status === 'pending');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-2">
              Listed Companies
            </h1>
            <p className="text-slate-400">Browse all companies on the Dänsétòuésän Exchange</p>
          </div>
          <Link to={createPageUrl("RegisterCompany")}>
            <Button className="bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Request to Add Company
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Active Companies ({approvedCompanies.length})</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {approvedCompanies.length === 0 ? (
              <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800 col-span-full">
                <CardContent className="py-12">
                  <p className="text-slate-400 text-center">No companies listed yet</p>
                </CardContent>
              </Card>
            ) : (
              approvedCompanies.map((company) => {
                const change = ((company.current_price - company.initial_price) / company.initial_price) * 100;
                const isPositive = change >= 0;

                return (
                  <Card key={company.id} className="bg-slate-900/50 backdrop-blur-xl border-slate-800 hover:border-emerald-500/50 transition-all group">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-white text-lg">{company.ticker}</CardTitle>
                            <Badge variant="outline" className="mt-1 text-xs border-white text-white">
                              {company.sector}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <h3 className="font-semibold text-white mb-2">{company.name}</h3>
                      <p className="text-slate-400 text-sm mb-4 line-clamp-2">{company.description}</p>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 text-sm">Current Price</span>
                          {editingCompanyId === company.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={editedPrice}
                                onChange={(e) => setEditedPrice(e.target.value)}
                                className="w-32 bg-slate-800 border-slate-700 text-white text-sm h-8"
                                step="0.01"
                              />
                              <Button
                                size="sm"
                                onClick={() => updatePriceMutation.mutate({ companyId: company.id, newPrice: editedPrice })}
                                disabled={updatePriceMutation.isLoading || isNaN(parseFloat(editedPrice)) || parseFloat(editedPrice) <= 0}
                                className="h-8 bg-emerald-600 hover:bg-emerald-700"
                              >
                                {updatePriceMutation.isLoading ? "Saving..." : "Save"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => { setEditingCompanyId(null); setEditedPrice(""); }}
                                className="h-8 border-slate-700 text-slate-400 hover:bg-slate-800"
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-white font-bold">{company.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Ð</span>
                              {user?.role === 'admin' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => { setEditingCompanyId(company.id); setEditedPrice(company.current_price.toFixed(2)); }}
                                  className="h-6 w-6 text-slate-500 hover:text-white"
                                >
                                  <Pencil className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          )}
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
                          <span className="text-slate-500 text-sm">Volatility</span>
                          <span className="text-white">
                            {typeof company.volatility === 'number' ? `${(company.volatility * 100).toFixed(2)}%` : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 text-sm">Available Shares</span>
                          <span className="text-white">{company.available_shares.toLocaleString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        {user?.email && pendingCompanies.filter(c => c.created_by === user.email).length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Your Pending Requests</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingCompanies.filter(c => c.created_by === user.email).map((company) => (
                <Card key={company.id} className="bg-slate-900/50 backdrop-blur-xl border-yellow-600/50">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-white text-lg">{company.ticker}</CardTitle>
                        <Badge className="mt-1 bg-yellow-500/20 text-yellow-400">
                          Pending Approval
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <h3 className="font-semibold text-white mb-2">{company.name}</h3>
                    <p className="text-slate-400 text-sm">{company.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
