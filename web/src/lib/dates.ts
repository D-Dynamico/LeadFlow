/** The viewer's IANA timezone, sent with every list request (R-1). */
export function browserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}
