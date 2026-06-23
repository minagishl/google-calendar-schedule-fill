import { mountContentScript } from "../../shared/contentScript/mount";
import { applyCalendarEvents } from "./applyCalendar";

mountContentScript("google-calendar-tonton", applyCalendarEvents);
