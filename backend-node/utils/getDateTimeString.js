/**
 * Function to get a date-time string with optional offsets.
 *
 * @param {Date|number} date - The date object or timestamp to format. Defaults to current date.
 * @param {number} hourOffset - Hour offset from UTC time. Defaults to local timezone.
 * @param {boolean} excludeMs - Flag to exclude milliseconds in the output. Defaults to true.
 * @param {boolean} excludeOffset - Flag to exclude timezone offset. Defaults to true.
 * @returns {string} Returns the formatted date-time string based on input parameters.
 */
export default function getDateTimeString(
  date = new Date(),
  hourOffset = NaN,
  excludeMs = true,
  excludeOffset = true
) {
  // Create a new date object based on the input
  const d = new Date(date instanceof Date ? date.getTime() : date || null);

  // Set the hour offset if not provided or is invalid
  if (typeof hourOffset !== "number" || isNaN(hourOffset)) {
    hourOffset = -d.getTimezoneOffset() / 60;
  }

  // Adjust the date based on the hour offset
  d.setTime(d.getTime() + hourOffset * 60 * 60 * 1000);

  // Generate the date-time string without milliseconds
  const dateTimeString = d
    .toISOString()
    .substring(0, excludeMs ? 19 : 23)
    .replace("T", " ");

  // Return the formatted date-time string without timezone offset if required
  if (excludeOffset) {
    return dateTimeString;
  }

  // Calculate timezone hours and minutes for output
  const tzHours = Math.floor(Math.abs(hourOffset)).toString().padStart(2, "0");
  const tzMinutes = (Math.floor(Math.abs(hourOffset) / 60) % 60)
    .toString()
    .padStart(2, "0");

  // Return the final formatted date-time string with timezone offset
  return (
    dateTimeString +
    " " +
    (hourOffset >= 0 ? "+" : "-") +
    tzHours +
    ":" +
    tzMinutes
  );
}
