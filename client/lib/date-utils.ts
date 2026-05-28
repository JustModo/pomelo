export function formatTimeForDisplay(date: Date) {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? "PM" : "AM";
  const normalizedHours = hours % 12 || 12;

  return `${String(normalizedHours).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${period}`;
}
