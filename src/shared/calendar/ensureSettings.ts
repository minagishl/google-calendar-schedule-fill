import browser from "webextension-polyfill";

import type { CalendarSettings } from "./events";
import { loadCalendarSettings } from "./events";

export async function ensureCalendarSettings(): Promise<CalendarSettings | null> {
  const settings = await loadCalendarSettings();

  if (
    !settings.calendarUrls.length ||
    (settings.calendarUrls.length === 1 && !settings.calendarUrls[0])
  ) {
    const url = prompt("Please enter your Google Calendar ICS URL:");
    if (url) {
      await browser.storage.local.set({ calendarUrls: [url] });
      return loadCalendarSettings();
    }
    console.log("Calendar URLs not set!");
    return null;
  }

  return settings;
}
