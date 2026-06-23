import { mountContentScript } from "../../shared/contentScript/mount";
import { applyCalendarEvents } from "./applyCalendar";

mountContentScript("calendar-schedule-fill-tonton", applyCalendarEvents);
