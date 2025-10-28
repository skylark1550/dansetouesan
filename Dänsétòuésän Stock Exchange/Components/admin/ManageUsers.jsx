import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ManageUsers() {
  const queryClient = useQueryClient();
  const [searchEmail, setSearchEmail] = useState('');

  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list('-created_date'),
    initialData: [],
  });

  const updateUserBalanceMutation = useMutation({
    mutationFn: async ({ userId, amount }) => {
      const user = users.find(u => u.id === userId);
      return await base44.entities.User.update(userId, {
        cash_balance: (user.cash_balance || 0) + amount
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
    },
  });

  const filteredUsers = searchEmail 
    ? users.filter(u => u.email.toLowerCase().includes(searchEmail.toLowerCase()))
    : users;

  return (
    <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <User className="w-5 h-5" />
          Manage Users
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Search by email..."
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
          className="bg-slate-800 border-slate-700 text-white"
        />
        <div className="grid gap-4 max-h-96 overflow-y-auto">
          {filteredUsers.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-white">{user.full_name}</p>
                  <Badge variant="outline" className="text-xs">
                    {user.role}
                  </Badge>
                </div>
                <p className="text-sm text-slate-400">{user.email}</p>
                <p className="text-sm text-emerald-400 mt-1">
                  Balance: {(user.cash_balance || 0).toFixed(2)} Ð
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const amount = prompt(`Add Danset to ${user.email}:`, "100");
                    if (amount && !isNaN(amount)) {
                      updateUserBalanceMutation.mutate({
                        userId: user.id,
                        amount: parseFloat(amount)
                      });
                    }
                  }}
                  className="flex items-center gap-1"
                >
                  <DollarSign className="w-3 h-3" />
                  Add Funds
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
