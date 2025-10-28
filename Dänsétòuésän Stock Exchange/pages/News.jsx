import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Newspaper, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { format } from "date-fns";

export default function News() {
  const [user, setUser] = useState(null);

  const { data: news = [] } = useQuery({
    queryKey: ['news'],
    queryFn: () => base44.entities.News.list('-created_date'),
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

  const getImpactIcon = (impact) => {
    switch(impact) {
      case 'very_positive':
      case 'positive':
        return <TrendingUp className="w-5 h-5 text-emerald-400" />;
      case 'very_negative':
      case 'negative':
        return <TrendingDown className="w-5 h-5 text-red-400" />;
      default:
        return <Minus className="w-5 h-5 text-slate-400" />;
    }
  };

  const getImpactBadge = (impact) => {
    const classes = {
      very_positive: 'bg-emerald-500/20 text-emerald-400',
      positive: 'bg-emerald-500/10 text-emerald-300',
      neutral: 'bg-slate-500/20 text-slate-400',
      negative: 'bg-red-500/10 text-red-300',
      very_negative: 'bg-red-500/20 text-red-400'
    };

    const labels = {
      very_positive: 'Very Positive',
      positive: 'Positive',
      neutral: 'Neutral',
      negative: 'Negative',
      very_negative: 'Very Negative'
    };

    return (
      <Badge className={classes[impact]}>
        {labels[impact]}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            Market News
          </h1>
          <p className="text-slate-400">Latest updates affecting the Dänsétòuésän Stock Exchange</p>
        </div>

        <div className="space-y-6">
          {news.length === 0 ? (
            <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
              <CardContent className="py-12">
                <div className="text-center">
                  <Newspaper className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No news available yet</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            news.map((item) => (
              <Card key={item.id} className="bg-slate-900/50 backdrop-blur-xl border-slate-800 hover:border-emerald-500/50 transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getImpactIcon(item.impact)}
                        <CardTitle className="text-white text-xl">{item.title}</CardTitle>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge variant="outline" className="text-white border-white">
                          {item.ticker}
                        </Badge>
                        {getImpactBadge(item.impact)}
                        <span className="text-xs text-slate-500">
                          {format(new Date(item.created_date), 'MMM d, yyyy HH:mm')} UTC
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-300 whitespace-pre-wrap">{item.content}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
