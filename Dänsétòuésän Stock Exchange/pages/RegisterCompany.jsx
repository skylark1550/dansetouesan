import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Building2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const SECTORS = [
  "Technology", "Finance", "Healthcare", "Energy", 
  "Consumer Goods", "Entertainment", "Real Estate", "Manufacturing", "Other"
];

export default function RegisterCompany() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    ticker: "",
    description: "",
    sector: "",
    initial_price: "",
    total_shares: "",
  });

  const createCompanyMutation = useMutation({
    mutationFn: async (data) => {
      const initialPrice = parseFloat(data.initial_price);
      const totalShares = parseInt(data.total_shares);
      
      return await base44.entities.Company.create({
        ...data,
        initial_price: initialPrice,
        current_price: initialPrice,
        total_shares: totalShares,
        available_shares: totalShares,
        status: 'pending'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      navigate(createPageUrl("Companies"));
    },
    onError: (error) => {
      setError(error.message || "Failed to register company");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.name || !formData.ticker || !formData.description || !formData.sector) {
      setError("Please fill in all required fields");
      return;
    }

    if (parseFloat(formData.initial_price) <= 0) {
      setError("Initial price must be greater than 0");
      return;
    }

    if (parseInt(formData.total_shares) <= 0) {
      setError("Total shares must be greater than 0");
      return;
    }

    createCompanyMutation.mutate(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl("Companies"))}
            className="text-slate-400 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Companies
          </Button>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            Request to Add Company
          </h1>
          <p className="text-slate-400">Submit your company for listing on the Dänsétòuésän Exchange</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-300">Company Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="e.g., Dänsétòuésän Technologies"
                    className="bg-slate-800 border-slate-700 text-white"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ticker" className="text-slate-300">Ticker Symbol *</Label>
                  <Input
                    id="ticker"
                    value={formData.ticker}
                    onChange={(e) => handleChange('ticker', e.target.value.toUpperCase())}
                    placeholder="e.g., DNST"
                    className="bg-slate-800 border-slate-700 text-white uppercase"
                    maxLength={5}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-slate-300">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Describe your company's business and vision..."
                  className="bg-slate-800 border-slate-700 text-white min-h-24"
                  required
                />
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="sector" className="text-slate-300">Sector *</Label>
                  <Select value={formData.sector} onValueChange={(value) => handleChange('sector', value)}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="Select sector" />
                    </SelectTrigger>
                    <SelectContent>
                      {SECTORS.map((sector) => (
                        <SelectItem key={sector} value={sector}>
                          {sector}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="initial_price" className="text-slate-300">Initial Price (Ð) *</Label>
                  <Input
                    id="initial_price"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.initial_price}
                    onChange={(e) => handleChange('initial_price', e.target.value)}
                    placeholder="10.00"
                    className="bg-slate-800 border-slate-700 text-white"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="total_shares" className="text-slate-300">Total Shares *</Label>
                  <Input
                    id="total_shares"
                    type="number"
                    min="1"
                    value={formData.total_shares}
                    onChange={(e) => handleChange('total_shares', e.target.value)}
                    placeholder="10000"
                    className="bg-slate-800 border-slate-700 text-white"
                    required
                  />
                </div>
              </div>

              <Alert className="bg-yellow-500/10 border-yellow-500/50">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <AlertDescription className="text-yellow-200">
                  Your company will need approval from a Dev Account before it can be listed for trading on the exchange.
                </AlertDescription>
              </Alert>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(createPageUrl("Companies"))}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createCompanyMutation.isPending}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  {createCompanyMutation.isPending ? "Submitting..." : "Submit Request"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
