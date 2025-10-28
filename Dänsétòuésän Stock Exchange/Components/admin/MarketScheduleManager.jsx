import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Clock, Save } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function MarketScheduleManager() {
  const queryClient = useQueryClient();
  const [schedule, setSchedule] = useState({
    open_time: '20:00',
    close_time: '08:00',
    lunch_break_start: '00:00',
    lunch_break_end: '01:00',
    auto_schedule_enabled: true
  });

  const { data: schedules = [] } = useQuery({
    queryKey: ['market-schedule'],
    queryFn: () => base44.entities.MarketSchedule.list(),
    initialData: [],
  });

  useEffect(() => {
    if (schedules.length > 0) {
      setSchedule(schedules[0]);
    }
  }, [schedules]);

  const updateScheduleMutation = useMutation({
    mutationFn: async (data) => {
      if (schedules.length === 0) {
        return await base44.entities.MarketSchedule.create(data);
      } else {
        return await base44.entities.MarketSchedule.update(schedules[0].id, data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-schedule'] });
    },
  });

  const handleSave = () => {
    updateScheduleMutation.mutate(schedule);
  };

  return (
    <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Market Schedule Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
          <div>
            <Label htmlFor="auto-schedule" className="text-white font-medium">
              Automatic Scheduling
            </Label>
            <p className="text-sm text-slate-400 mt-1">
              Market opens/closes automatically based on schedule
            </p>
          </div>
          <Switch
            id="auto-schedule"
            checked={schedule.auto_schedule_enabled}
            onCheckedChange={(checked) => setSchedule({...schedule, auto_schedule_enabled: checked})}
          />
        </div>

        <Alert className="bg-cyan-500/10 border-cyan-500/50">
          <AlertDescription className="text-cyan-200 text-sm">
            Current times: Open 20:00 UTC (4am SGT), Close 08:00 UTC (4pm SGT), Lunch 00:00-01:00 UTC
          </AlertDescription>
        </Alert>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="open-time" className="text-slate-300">Market Open Time (UTC)</Label>
            <Input
              id="open-time"
              type="time"
              value={schedule.open_time}
              onChange={(e) => setSchedule({...schedule, open_time: e.target.value})}
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="close-time" className="text-slate-300">Market Close Time (UTC)</Label>
            <Input
              id="close-time"
              type="time"
              value={schedule.close_time}
              onChange={(e) => setSchedule({...schedule, close_time: e.target.value})}
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lunch-start" className="text-slate-300">Lunch Break Start (UTC)</Label>
            <Input
              id="lunch-start"
              type="time"
              value={schedule.lunch_break_start}
              onChange={(e) => setSchedule({...schedule, lunch_break_start: e.target.value})}
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lunch-end" className="text-slate-300">Lunch Break End (UTC)</Label>
            <Input
              id="lunch-end"
              type="time"
              value={schedule.lunch_break_end}
              onChange={(e) => setSchedule({...schedule, lunch_break_end: e.target.value})}
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>
        </div>

        <Button
          onClick={handleSave}
          className="w-full bg-emerald-600 hover:bg-emerald-700"
          disabled={updateScheduleMutation.isPending}
        >
          <Save className="w-4 h-4 mr-2" />
          {updateScheduleMutation.isPending ? 'Saving...' : 'Save Schedule'}
        </Button>
      </CardContent>
    </Card>
  );
}
