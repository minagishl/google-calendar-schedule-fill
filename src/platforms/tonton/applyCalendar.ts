import { ensureCalendarSettings } from "../../shared/calendar/ensureSettings";
import {
  fetchCalendarEvents,
  indexEventsByDate,
  isSlotBusy,
} from "../../shared/calendar/events";
import { markBusyTimeSlots } from "./markBusySlots";
import { buildSlotEntries, parseSchedulesFromDom } from "./parseSchedule";

export async function applyCalendarEvents(): Promise<void> {
  const settings = await ensureCalendarSettings();
  if (!settings) {
    return;
  }

  const schedules = parseSchedulesFromDom();
  if (schedules.length === 0) {
    console.warn("No Tonton schedules found on the page");
    return;
  }

  try {
    const earliestDate = new Date(
      Math.min(...schedules.map((s) => new Date(s.date).getTime()))
    );
    const latestDate = new Date(
      Math.max(...schedules.map((s) => new Date(s.date).getTime()))
    );
    const startDate = new Date(
      earliestDate.getTime() - 7 * 24 * 60 * 60 * 1000
    );
    const endDate = new Date(latestDate.getTime() + 7 * 24 * 60 * 60 * 1000);

    const events = await fetchCalendarEvents(
      settings.calendarUrls,
      startDate,
      endDate
    );
    const eventsByDate = indexEventsByDate(events);

    if (events.length === 0) {
      console.warn("No calendar events found from any source");
    }

    for (const schedule of schedules) {
      const scheduleDate = new Date(schedule.date);
      const dayOfWeek = scheduleDate.getDay();

      if (
        settings.autoDeclineWeekends &&
        (dayOfWeek === 0 || dayOfWeek === 6)
      ) {
        for (const entry of buildSlotEntries(schedule)) {
          markBusyTimeSlots(new Date(entry.timestamp));
        }
        continue;
      }

      const dateEvents = eventsByDate.get(schedule.date) ?? [];
      if (dateEvents.length === 0) {
        console.warn("No calendar events found for", schedule.date);
      }

      const processedSlots = new Set<number>();

      for (const entry of buildSlotEntries(schedule)) {
        if (processedSlots.has(entry.timestamp)) {
          continue;
        }

        const busy = isSlotBusy(
          entry.timestamp,
          entry.timestamp + 60 * 1000,
          schedule.date,
          eventsByDate,
          settings,
          entry.time
        );

        if (busy) {
          processedSlots.add(entry.timestamp);
          markBusyTimeSlots(new Date(entry.timestamp));
        }
      }
    }
  } catch (error) {
    console.error("Error processing Tonton schedules:", error);
  }
}
