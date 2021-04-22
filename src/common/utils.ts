export class Utils {
  static isNullOrWhitespace(value: string): boolean {
    return !value || '' === value.trim() || value.trim().length === 0;
  }
}
