import browser from "webextension-polyfill";

import { icsToJson } from "./icsToJson";
import type { ICalEvent } from "./icsToJson";

export interface CalendarSettings {
  calendarUrls: string[];
  autoDeclineWeekends: boolean;
  startTime: string;
  endTime: string;
  enforceWorkingHours: boolean;
}

export async function loadCalendarSettings(): Promise<CalendarSettings> {
  const result = await browser.storage.local.get([
    "calendarUrls",
    "autoDeclineWeekends",
    "startTime",
    "endTime",
    "enforceWorkingHours",
  ]);

  return {
    calendarUrls: (result.calendarUrls as string[]) || [""],
    autoDeclineWeekends: !!result.autoDeclineWeekends,
    startTime: (result.startTime as string) || "09:00",
    endTime: (result.endTime as string) || "17:00",
    enforceWorkingHours: !!result.enforceWorkingHours,
  };
}

export async function fetchCalendarEvents(
  calendarUrls: string[],
  startDate: Date,
  endDate: Date
): Promise<ICalEvent[]> {
  const fetchPromises = calendarUrls
    .filter((url) => url.trim())
    .map(async (url) => {
      try {
        const response = (await browser.runtime.sendMessage({
          type: "FETCH_ICS",
          url,
        })) as { success: boolean; error?: string; data?: string };

        if (!response.success || !response.data) {
          console.error(
            `Error fetching calendar ${url}:`,
            response.error || "No data received"
          );
          return [];
        }

        return icsToJson(response.data, startDate, endDate);
      } catch (error) {
        console.error(`Failed to process calendar ${url}:`, error);
        return [];
      }
    });

  const eventsArrays = await Promise.all(fetchPromises);
  return eventsArrays.flat();
}

export function indexEventsByDate(
  events: ICalEvent[]
): Map<string, ICalEvent[]> {
  const eventsByDate = new Map<string, ICalEvent[]>();

  for (const event of events) {
    const existing = eventsByDate.get(event.dateKey);
    if (existing) {
      existing.push(event);
    } else {
      eventsByDate.set(event.dateKey, [event]);
    }
  }

  for (const dateEvents of eventsByDate.values()) {
    dateEvents.sort((a, b) => a.startTimestamp - b.startTimestamp);
  }

  return eventsByDate;
}

export function overlapsCalendarEvents(
  startTimestamp: number,
  endTimestamp: number,
  dateEvents: ICalEvent[]
): boolean {
  for (const event of dateEvents) {
    if (event.endTimestamp <= startTimestamp) {
      continue;
    }

    if (event.startTimestamp >= endTimestamp) {
      break;
    }

    if (
      startTimestamp < event.endTimestamp &&
      endTimestamp > event.startTimestamp
    ) {
      return true;
    }
  }

  return false;
}

export function isSlotBusy(
  startTimestamp: number,
  endTimestamp: number,
  dateKey: string,
  eventsByDate: Map<string, ICalEvent[]>,
  settings: CalendarSettings,
  slotTime?: string
): boolean {
  const slotDate = new Date(startTimestamp);
  const dayOfWeek = slotDate.getDay();

  if (settings.autoDeclineWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
    return true;
  }

  if (settings.enforceWorkingHours && slotTime) {
    if (slotTime < settings.startTime || slotTime >= settings.endTime) {
      return true;
    }
  }

  const dateEvents = eventsByDate.get(dateKey) ?? [];
  return overlapsCalendarEvents(startTimestamp, endTimestamp, dateEvents);
}
