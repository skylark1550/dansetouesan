import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, CheckCircle, TrendingUp, AlertCircle, Zap } from "lucide-react";

export default function Changelog() {
  const updates = [
    {
      version: "1.2",
      date: "28/10/25",
      badge: "Latest",
      badgeColor: "bg-emerald-500/20 text-emerald-400",
      icon: Zap,
      features: [
        "Automatic market scheduling (opens 20:00 UTC, closes 08:00 UTC)",
        "Lunch break auto-closure from 00:00-01:00 UTC",
        "Admin can customize market hours and override auto-schedule",
        "Market News system - admins can publish news affecting stock prices",
        "News impact system: Very Positive (+15%), Positive (+7%), Neutral (0%), Negative (-7%), Very Negative (-15%)",
        "Price percentages now reset when market closes for maintenance",
        "Added market report generation feature for admins",
        "Report format includes all company prices with emoji indicators",
        "Market News page accessible to all users",
        "Admins can see immediate price impact after publishing news",
        "Improved UI color contrast for sidebar elements",
        "Fixed sector badge colors on dashboard",
        "Enhanced readability throughout the application",
        "Market schedule configuration panel for admins",
        "Auto-schedule can be enabled/disabled by admins"
      ]
    },
    {
      version: "1.1",
      date: "27/10/25",
      badge: "Previous",
      badgeColor: "bg-cyan-500/20 text-cyan-400",
      icon: Sparkles,
      features: [
        "Implemented 5-second trade cooldown to prevent spam",
        "New dynamic pricing system: stock prices adjust based on trade volume",
        "Market volatility set to 2.5% (customizable per company by admin)",
        "Admin can now set custom volatility for each individual stock",
        "Admin can manually adjust stock prices for any company",
        "Admin can add funds to user accounts",
        "Added number formatting with commas for all large values",
        "Portfolio composition chart now shows percentage breakdowns",
        "Individual company percentages displayed below pie chart",
        "Enhanced Admin Controls page with comprehensive management tools",
        "User management panel for admins",
        "Ability to search users by email",
        "Market open/close control for maintenance",
        "Custom status messages when market is closed"
      ]
    },
    {
      version: "1.0",
      date: "26/10/25",
      badge: "Initial Release",
      badgeColor: "bg-purple-500/20 text-purple-400",
      icon: TrendingUp,
      features: [
        "User registration and authentication system",
        "Starting balance of 100 Danset (Ð) for all new users",
        "Company listing and approval system",
        "Basic buy and sell functionality for stocks",
        "Real-time stock price tracking",
        "Portfolio management and holdings tracking",
        "Transaction history with detailed logs",
        "Market Dashboard with key financial metrics",
        "Trading Floor with live market updates",
        "Admin approval workflow for new company requests",
        "Company profile pages with sector categorization",
        "Profit/Loss tracking and calculations",
        "Cash balance management",
        "Share availability tracking",
        "Responsive design for mobile and desktop",
        "Dark theme with gradient backgrounds"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            Changelog
          </h1>
          <p className="text-slate-400">Track updates and new features on the Dänsétòuésän Stock Exchange</p>
        </div>

        <Alert className="mb-8 bg-cyan-500/10 border-cyan-500/50">
          <AlertCircle className="h-4 w-4 text-cyan-400" />
          <AlertDescription className="text-cyan-200">
            Stay up to date with the latest improvements, bug fixes, and new features added to the platform.
          </AlertDescription>
        </Alert>

        <div className="space-y-6">
          {updates.map((update) => (
            <Card key={update.version} className="bg-slate-900/50 backdrop-blur-xl border-slate-800 hover:border-emerald-500/50 transition-all duration-300">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
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
                <div className="grid md:grid-cols-2 gap-3">
                  {update.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-colors">
                      <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-300 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-8 bg-slate-900/50 backdrop-blur-xl border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Coming Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-400">
              We're constantly working on new features and improvements. Stay tuned for upcoming updates!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const Alert = ({ children, className }) => (
  <div className={`rounded-lg border p-4 ${className}`}>
    {children}
  </div>
);

const AlertDescription = ({ children, className }) => (
  <div className={`text-sm ${className}`}>
    {children}
  </div>
);
