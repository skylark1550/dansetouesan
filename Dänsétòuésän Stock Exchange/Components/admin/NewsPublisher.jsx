import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Newspaper, Send } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function NewsPublisher() {
  const queryClient = useQueryClient();
  const [newsData, setNewsData] = useState({
    title: '',
    content: '',
    company_id: '',
    ticker: '',
    impact: 'neutral'
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.filter({ status: 'approved' }),
    initialData: [],
  });

  const publishNewsMutation = useMutation({
    mutationFn: async (data) => {
      const news = await base44.entities.News.create(data);
      
      // Apply price impact
      const company = companies.find(c => c.id === data.company_id);
      if (company) {
        const impactMap = {
          very_positive: 0.15,  // +15%
          positive: 0.07,       // +7%
          neutral: 0,           // 0%
          negative: -0.07,      // -7%
          very_negative: -0.15  // -15%
        };
        
        const impactPercent = impactMap[data.impact];
        const priceChange = company.current_price * impactPercent;
        const newPrice = Math.max(0.01, company.current_price + priceChange);
        
        await base44.entities.Company.update(company.id, {
          current_price: newPrice
        });

        await base44.entities.News.update(news.id, {
          impact_applied: true
        });
      }
      
      return news;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news'] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setNewsData({
        title: '',
        content: '',
        company_id: '',
        ticker: '',
        impact: 'neutral'
      });
    },
  });

  const handleCompanyChange = (companyId) => {
    const company = companies.find(c => c.id === companyId);
    if (company) {
      setNewsData({
        ...newsData,
        company_id: companyId,
        ticker: company.ticker
      });
    }
  };

  const handlePublish = () => {
    if (!newsData.title || !newsData.content || !newsData.company_id) return;
    publishNewsMutation.mutate(newsData);
  };

  return (
    <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Newspaper className="w-5 h-5" />
          Publish Market News
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="bg-yellow-500/10 border-yellow-500/50">
          <AlertDescription className="text-yellow-200 text-sm">
            Publishing news will immediately impact the selected company's stock price based on the chosen impact level.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="news-title" className="text-slate-300">Headline *</Label>
          <Input
            id="news-title"
            value={newsData.title}
            onChange={(e) => setNewsData({...newsData, title: e.target.value})}
            placeholder="Breaking: Major development at..."
            className="bg-slate-800 border-slate-700 text-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="news-content" className="text-slate-300">Content *</Label>
          <Textarea
            id="news-content"
            value={newsData.content}
            onChange={(e) => setNewsData({...newsData, content: e.target.value})}
            placeholder="Full news story..."
            className="bg-slate-800 border-slate-700 text-white min-h-32"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="affected-company" className="text-slate-300">Affected Company *</Label>
            <Select value={newsData.company_id} onValueChange={handleCompanyChange}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="Select company" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.ticker} - {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="impact-level" className="text-slate-300">Impact Level *</Label>
            <Select value={newsData.impact} onValueChange={(value) => setNewsData({...newsData, impact: value})}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="very_positive">Very Positive (+15%)</SelectItem>
                <SelectItem value="positive">Positive (+7%)</SelectItem>
                <SelectItem value="neutral">Neutral (0%)</SelectItem>
                <SelectItem value="negative">Negative (-7%)</SelectItem>
                <SelectItem value="very_negative">Very Negative (-15%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={handlePublish}
          disabled={!newsData.title || !newsData.content || !newsData.company_id || publishNewsMutation.isPending}
          className="w-full bg-emerald-600 hover:bg-emerald-700"
        >
          <Send className="w-4 h-4 mr-2" />
          {publishNewsMutation.isPending ? 'Publishing...' : 'Publish News'}
        </Button>
      </CardContent>
    </Card>
  );
}
