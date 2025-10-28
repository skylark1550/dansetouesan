
import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Plus } from "lucide-react";

const SECTORS = [
  "Technology", "Finance", "Healthcare", "Energy", 
  "Consumer Goods", "Entertainment", "Real Estate", "Manufacturing", "Other"
];

export default function AddCompanyForm({ onSuccess }) {
  const [showForm, setShowForm] = useState(false);
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
        market_volatility: 2.5, // Added market_volatility here
        status: 'approved'
      });
    },
    onSuccess: () => {
      onSuccess();
      setShowForm(false);
      setFormData({
        name: "",
        ticker: "",
        description: "",
        sector: "",
        initial_price: "",
        total_shares: "",
      });
    },
    onError: (error) => {
      setError(error.message || "Failed to create company");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    createCompanyMutation.mutate(formData);
  };

  return (
    <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Add Company Directly</CardTitle>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            {showForm ? 'Cancel' : 'Add Company'}
          </Button>
        </div>
      </CardHeader>
      {showForm && (
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-300">Company Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="bg-slate-800 border-slate-700 text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ticker" className="text-slate-300">Ticker *</Label>
                <Input
                  id="ticker"
                  value={formData.ticker}
                  onChange={(e) => setFormData({...formData, ticker: e.target.value.toUpperCase()})}
                  className="bg-slate-800 border-slate-700 text-white"
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
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="bg-slate-800 border-slate-700 text-white"
                required
              />
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sector" className="text-slate-300">Sector *</Label>
                <Select value={formData.sector} onValueChange={(value) => setFormData({...formData, sector: value})}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTORS.map((sector) => (
                      <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="price" className="text-slate-300">Price (Ð) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.initial_price}
                  onChange={(e) => setFormData({...formData, initial_price: e.target.value})}
                  className="bg-slate-800 border-slate-700 text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shares" className="text-slate-300">Shares *</Label>
                <Input
                  id="shares"
                  type="number"
                  value={formData.total_shares}
                  onChange={(e) => setFormData({...formData, total_shares: e.target.value})}
                  className="bg-slate-800 border-slate-700 text-white"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
              Create Company
            </Button>
          </form>
        </CardContent>
      )}
    </Card>
  );
}
