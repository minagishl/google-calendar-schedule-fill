export interface TimeSlot {
  time: string;
}

export interface ScheduleData {
  date: string;
  availableSlots: TimeSlot[];
}

export function parseSchedulesFromDom(): ScheduleData[] {
  const schedules = document.querySelectorAll<HTMLElement>(".schedulelist");
  const result: ScheduleData[] = [];

  for (const schedule of schedules) {
    const labelElement = schedule.querySelector("label");
    const dateText = labelElement?.textContent ?? "";
    const date = new Date(dateText);
    const timeline = schedule.querySelector<HTMLElement>(".timeline");

    if (!timeline) {
      continue;
    }

    const timeSlots = timeline.querySelectorAll<HTMLSpanElement>("div span");
    const availableSlots: TimeSlot[] = [];

    for (const slot of timeSlots) {
      const isEnabled = slot.classList.contains("timesel_enabled");
      const timeId = slot.id;
      const timePart = timeId.split("_").pop() || "";
      const hour = timePart.substring(0, 2);
      const minute = timePart.substring(2, 4);
      const formattedTime = `${hour}:${minute}`;

      if (isEnabled) {
        availableSlots.push({ time: formattedTime });
      }
    }

    const jstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
    const jstDateString = jstDate.toISOString().split("T")[0];
    result.push({ date: jstDateString, availableSlots });
  }

  return result;
}

export function buildSlotEntries(schedule: ScheduleData) {
  return schedule.availableSlots.map((slot) => {
    const [hours, minutes] = slot.time.split(":").map(Number);
    const slotDate = new Date(schedule.date);
    slotDate.setHours(hours, minutes, 0, 0);
    return {
      time: slot.time,
      timestamp: slotDate.getTime(),
    };
  });
}
