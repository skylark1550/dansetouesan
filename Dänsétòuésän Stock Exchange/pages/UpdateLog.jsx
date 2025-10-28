import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, CheckCircle, TrendingUp } from "lucide-react";

export default function UpdateLog() {
  const updates = [
    {
      version: "1.1",
      date: "2024",
      badge: "Latest",
      badgeColor: "bg-emerald-500/20 text-emerald-400",
      icon: Sparkles,
      features: [
        "Added market open/close control for admins",
        "Implemented 5-second trade cooldown to prevent spam",
        "New pricing system: prices now adjust based on trade volume",
        "Market volatility reduced to 2.5% (customizable per company)",
        "Admin can now set custom volatility for each stock",
        "Admin can manually adjust stock prices",
        "Admin can give users additional funds",
        "Improved UI colors and readability",
        "Added number formatting with commas for large values",
        "Portfolio composition now shows percentage breakdowns",
        "Buy and Sell pages separated for better UX",
        "Added Request Company page for users",
        "Enhanced Admin Controls page"
      ]
    },
    {
      version: "1.0",
      date: "2024",
      badge: "Initial Release",
      badgeColor: "bg-cyan-500/20 text-cyan-400",
      icon: TrendingUp,
      features: [
        "User registration and authentication system",
        "Starting balance of 100 Danset for all new users",
        "Company listing and approval system",
        "Basic buy and sell functionality",
        "Real-time stock price tracking",
        "Portfolio management and holdings tracking",
        "Transaction history",
        "Market Dashboard with key metrics",
        "Trading Floor with live updates",
        "Admin approval workflow for new companies",
        "Company profile pages with sector categorization",
        "Profit/Loss tracking"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            Update Log
          </h1>
          <p className="text-slate-400">Track the evolution of the Dänsétòuésän Stock Exchange</p>
        </div>

        <div className="space-y-6">
          {updates.map((update) => (
            <Card key={update.version} className="bg-slate-900/50 backdrop-blur-xl border-slate-800 hover:border-emerald-500/50 transition-all">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center">
                      <update.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-white text-2xl">Version {update.version}</CardTitle>
                      <p className="text-slate-400 text-sm">{update.date}</p>
                    </div>
                  </div>
                  <Badge className={update.badgeColor}>
                    {update.badge}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {update.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3 text-slate-300">
                      <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
