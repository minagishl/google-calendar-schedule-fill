export function markBusyTimeSlots(date: Date): void {
  const target = document.querySelector<HTMLInputElement>(
    'fieldset[id="schedule_list"] input[onclick="MT_setTimelineColor(1)"]'
  );
  if (target) {
    target.checked = true;
    target.click();
  }

  const button = document.querySelector<HTMLAnchorElement>("a#add-ancher");
  const dialog = document.querySelector<HTMLElement>("div#add-form-dlg");

  if (button && dialog?.style.visibility === "hidden") {
    button.dispatchEvent(
      new Event("click", { bubbles: true, cancelable: true })
    );
  }

  const schedules = document.querySelectorAll<HTMLElement>(
    'fieldset[id="schedule_list"] > table:not(:first-child)'
  );

  const pad = (n: number) => n.toString().padStart(2, "0");

  schedules.forEach((schedule, idx) => {
    const labelElement = schedule.querySelector<HTMLElement>(
      "tbody > tr > td > div.nowrap-pop"
    );
    const dateText = labelElement?.textContent?.trim();
    if (!dateText) {
      return;
    }

    const inputDate = new Date(
      `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())}`
    );
    const labelDate = new Date(dateText.replace(/-/g, "/"));

    if (
      inputDate.getFullYear() === labelDate.getFullYear() &&
      inputDate.getMonth() === labelDate.getMonth() &&
      inputDate.getDate() === labelDate.getDate()
    ) {
      const hour = pad(date.getHours());
      const minute = pad(date.getMinutes());
      const spanId = `mtgtimeedit_${idx + 1}_${hour}${minute}`;
      const span = schedule.querySelector<HTMLElement>(`span[id="${spanId}"]`);
      if (span) {
        for (const type of ["mousedown", "mouseup"]) {
          const event = new MouseEvent(type, {
            bubbles: true,
            cancelable: true,
            view: window,
          });
          span.dispatchEvent(event);
        }
      }
    }
  });
}
