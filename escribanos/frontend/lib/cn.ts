/** Join Tailwind class strings; falsy values are omitted. */
export function cn(...parts: Array<string | undefined | false | null>): string {
  return parts.filter(Boolean).join(" ");
}
