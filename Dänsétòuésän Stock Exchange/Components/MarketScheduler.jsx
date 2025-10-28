import { useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function MarketScheduler() {
  const queryClient = useQueryClient();

  const { data: schedules = [] } = useQuery({
    queryKey: ['market-schedule'],
    queryFn: () => base44.entities.MarketSchedule.list(),
    initialData: [],
    refetchInterval: 30000, // Check every 30 seconds
  });

  const { data: marketStatus = [] } = useQuery({
    queryKey: ['market-status'],
    queryFn: () => base44.entities.MarketStatus.list(),
    initialData: [],
    refetchInterval: 30000,
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.filter({ status: 'approved' }),
    initialData: [],
  });

  const updateMarketStatusMutation = useMutation({
    mutationFn: async ({ isOpen, message }) => {
      if (marketStatus.length === 0) {
        return await base44.entities.MarketStatus.create({ is_open: isOpen, message });
      } else {
        return await base44.entities.MarketStatus.update(marketStatus[0].id, { is_open: isOpen, message });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-status'] });
    },
  });

  const resetPricesMutation = useMutation({
    mutationFn: async () => {
      const updatePromises = companies.map(company => 
        base44.entities.Company.update(company.id, {
          initial_price: company.current_price
        })
      );
      await Promise.all(updatePromises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });

  useEffect(() => {
    const checkSchedule = async () => {
      if (schedules.length === 0) return;
      
      const schedule = schedules[0];
      if (!schedule.auto_schedule_enabled) return;

      const now = new Date();
      const currentUTCHours = now.getUTCHours();
      const currentUTCMinutes = now.getUTCMinutes();
      const currentTimeInMinutes = currentUTCHours * 60 + currentUTCMinutes;

      // Parse schedule times
      const [openHour, openMinute] = schedule.open_time.split(':').map(Number);
      const [closeHour, closeMinute] = schedule.close_time.split(':').map(Number);
      const [lunchStartHour, lunchStartMinute] = schedule.lunch_break_start.split(':').map(Number);
      const [lunchEndHour, lunchEndMinute] = schedule.lunch_break_end.split(':').map(Number);

      const openTime = openHour * 60 + openMinute;
      const closeTime = closeHour * 60 + closeMinute;
      const lunchStart = lunchStartHour * 60 + lunchStartMinute;
      const lunchEnd = lunchEndHour * 60 + lunchEndMinute;

      const currentStatus = marketStatus.length > 0 ? marketStatus[0] : { is_open: true };

      // Check if we're in lunch break
      if (currentTimeInMinutes >= lunchStart && currentTimeInMinutes < lunchEnd) {
        if (currentStatus.is_open) {
          await updateMarketStatusMutation.mutateAsync({
            isOpen: false,
            message: "Market closed for lunch break (00:00-01:00 UTC)"
          });
        }
        return;
      }

      // Check if market should be open or closed
      let shouldBeOpen = false;
      
      if (closeTime > openTime) {
        // Normal case: opens and closes on same day
        shouldBeOpen = currentTimeInMinutes >= openTime && currentTimeInMinutes < closeTime;
      } else {
        // Spans midnight: opens at night, closes next morning
        shouldBeOpen = currentTimeInMinutes >= openTime || currentTimeInMinutes < closeTime;
      }

      // Update market status if it changed
      if (shouldBeOpen && !currentStatus.is_open) {
        await updateMarketStatusMutation.mutateAsync({
          isOpen: true,
          message: ""
        });
      } else if (!shouldBeOpen && currentStatus.is_open) {
        // Reset prices when closing
        await resetPricesMutation.mutateAsync();
        await updateMarketStatusMutation.mutateAsync({
          isOpen: false,
          message: "Market closed. Opens at 20:00 UTC (04:00 SGT, 08:00 GMT+12)"
        });
      }
    };

    checkSchedule();
    const interval = setInterval(checkSchedule, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [schedules, marketStatus, companies]);

  return null; // This component doesn't render anything
}
