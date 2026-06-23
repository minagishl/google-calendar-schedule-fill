const WEEKDAY_MAP: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
  // Japanese single-kanji weekday labels (日〜土)
  日: 0,
  月: 1,
  火: 2,
  水: 3,
  木: 4,
  金: 5,
  土: 6,
};

export interface TappySlot {
  dateKey: string;
  timeLabel: string;
  startTimestamp: number;
  endTimestamp: number;
}

export function formatLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseTappyDateColumn(
  label: string,
  referenceDate = new Date()
): string | null {
  const match = label.trim().match(/^(\d{1,2})\/(\d{1,2})$/);
  if (!match) {
    return null;
  }

  const month = Number.parseInt(match[1], 10);
  const day = Number.parseInt(match[2], 10);
  let year = referenceDate.getFullYear();

  const candidate = new Date(year, month - 1, day);
  const sixMonthsAgo = new Date(referenceDate);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  if (candidate < sixMonthsAgo) {
    year += 1;
  }

  return formatLocalDateKey(new Date(year, month - 1, day));
}

function parseWeekdayFromLabel(label: string): number | null {
  const trimmed = label.trim();
  const direct = WEEKDAY_MAP[trimmed];
  if (direct !== undefined) {
    return direct;
  }

  const japaneseMatch = trimmed.match(/^([日月火水木金土])曜(日)?$/);
  if (japaneseMatch) {
    return WEEKDAY_MAP[japaneseMatch[1]] ?? null;
  }

  return null;
}

export function parseTappyWeekdayColumn(
  label: string,
  referenceDate = new Date()
): string | null {
  const targetDay = parseWeekdayFromLabel(label);
  if (targetDay === null) {
    return null;
  }

  const date = new Date(referenceDate);
  const currentDay = date.getDay();
  let dayOffset = targetDay - currentDay;

  if (dayOffset < 0) {
    dayOffset += 7;
  }

  date.setDate(date.getDate() + dayOffset);
  return formatLocalDateKey(date);
}

export function parseTappyTimeRow(
  label: string
): { hours: number; minutes: number } | null {
  const match = label.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    return null;
  }

  return {
    hours: Number.parseInt(match[1], 10),
    minutes: Number.parseInt(match[2], 10),
  };
}

export function resolveTappySlot(
  columnLabel: string,
  rowLabel: string,
  referenceDate = new Date()
): TappySlot | null {
  const dateKey =
    parseTappyDateColumn(columnLabel, referenceDate) ??
    parseTappyWeekdayColumn(columnLabel, referenceDate);

  const time = parseTappyTimeRow(rowLabel);
  if (!dateKey || !time) {
    return null;
  }

  const [year, month, day] = dateKey.split("-").map(Number);
  const startDate = new Date(
    year,
    month - 1,
    day,
    time.hours,
    time.minutes,
    0,
    0
  );
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
  const timeLabel = `${String(time.hours).padStart(2, "0")}:${String(time.minutes).padStart(2, "0")}`;

  return {
    dateKey,
    timeLabel,
    startTimestamp: startDate.getTime(),
    endTimestamp: endDate.getTime(),
  };
}

export function collectTappySlots(
  table: HTMLTableElement,
  referenceDate = new Date()
): Array<{ cell: HTMLTableCellElement; slot: TappySlot }> {
  const headerCells = table.querySelectorAll("tr:first-child th");
  const columnLabels = Array.from(headerCells)
    .slice(1)
    .map((cell) => cell.textContent?.trim() ?? "");

  const slots: Array<{ cell: HTMLTableCellElement; slot: TappySlot }> = [];

  for (const row of table.querySelectorAll("tr:not(:first-child)")) {
    const rowLabel = row.querySelector("th")?.textContent?.trim() ?? "";
    const cells = row.querySelectorAll<HTMLTableCellElement>("td");

    cells.forEach((cell, columnIndex) => {
      const columnLabel = columnLabels[columnIndex];
      if (!columnLabel) {
        return;
      }

      const slot = resolveTappySlot(columnLabel, rowLabel, referenceDate);
      if (slot) {
        slots.push({ cell, slot });
      }
    });
  }

  return slots;
}

export function setTappyCellChecked(
  cell: HTMLTableCellElement,
  checked: boolean
): void {
  const checkbox = cell.querySelector<HTMLInputElement>(
    'input[type="checkbox"]'
  );
  if (!checkbox || checkbox.checked === checked) {
    if (!checked) {
      cell.querySelector(".checked-box")?.remove();
    }
    return;
  }

  checkbox.checked = checked;

  if (checked) {
    if (!cell.querySelector(".checked-box")) {
      const marker = document.createElement("div");
      marker.className = "checked-box";
      marker.innerHTML = '<i class="icon-chat-alt-fill"></i>';
      cell.appendChild(marker);
    }
    return;
  }

  cell.querySelector(".checked-box")?.remove();
}
