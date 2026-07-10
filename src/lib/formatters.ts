import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";

export function formatTimestamp(value: string) {
  const date = new Date(value);

  if (isToday(date)) {
    return `Today • ${format(date, "h:mm a")}`;
  }

  if (isYesterday(date)) {
    return `Yesterday • ${format(date, "h:mm a")}`;
  }

  return format(date, "MMM d • h:mm a");
}

export function formatTimelineDate(value: string) {
  return format(new Date(value), "MMM d, yyyy");
}

export function relativeTime(value: string) {
  return formatDistanceToNow(new Date(value), { addSuffix: true });
}

export function splitTags(rawValue: string | undefined) {
  if (!rawValue) {
    return [];
  }

  return rawValue
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 6);
}
