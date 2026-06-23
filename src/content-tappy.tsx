import { createRoot } from "react-dom/client";
import browser from "webextension-polyfill";

import { ExtensionButtons } from "./components/ExtensionButtons";
import {
  fetchCalendarEvents,
  indexEventsByDate,
  isSlotBusy,
  loadCalendarSettings,
} from "./utils/calendarEvents";
import { collectTappySlots, setTappyCellChecked } from "./utils/tappyTable";

const applyCalendarEvents = async (): Promise<void> => {
  const settings = await loadCalendarSettings();

  if (
    !settings.calendarUrls.length ||
    (settings.calendarUrls.length === 1 && !settings.calendarUrls[0])
  ) {
    const url = prompt("Please enter your Google Calendar ICS URL:");
    if (url) {
      await browser.storage.local.set({ calendarUrls: [url] });
      await applyCalendarEvents();
    }
    console.log("Calendar URLs not set!");
    return;
  }

  const table = document.querySelector<HTMLTableElement>("table.TappyTable");
  if (!table) {
    console.warn("Tappy schedule table not found");
    return;
  }

  const slots = collectTappySlots(table);
  if (slots.length === 0) {
    console.warn("No resolvable Tappy slots found in the table");
    return;
  }

  try {
    const timestamps = slots.map(({ slot }) => slot.startTimestamp);
    const earliestDate = new Date(Math.min(...timestamps));
    const latestDate = new Date(Math.max(...timestamps));
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

    let markedAvailable = 0;
    let markedBusy = 0;

    for (const { cell, slot } of slots) {
      const busy = isSlotBusy(
        slot.startTimestamp,
        slot.endTimestamp,
        slot.dateKey,
        eventsByDate,
        settings,
        slot.timeLabel
      );

      if (busy) {
        setTappyCellChecked(cell, false);
        markedBusy += 1;
      } else {
        setTappyCellChecked(cell, true);
        markedAvailable += 1;
      }
    }

    console.log(
      `Tappy calendar applied: ${markedAvailable} available, ${markedBusy} busy`
    );
  } catch (error) {
    console.error("Error processing Tappy schedule:", error);
  }
};

const style = document.createElement("style");
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);

const container = document.createElement("div");
document.body.appendChild(container);

const root = createRoot(container);
root.render(
  <ExtensionButtons
    containerId="google-calendar-tonton-tappy"
    onApplyCalendar={applyCalendarEvents}
  />
);
