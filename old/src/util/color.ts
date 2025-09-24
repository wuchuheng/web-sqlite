// Centralized logging system
export enum Color {
  red = "\x1b[31m",
  green = "\x1b[32m",
  bold = "\x1b[1m",
  reset = "\x1b[0m",
}

export const inColor = (text: string, ...colors: Color[]) =>
  colors.join("") + text + Color.reset;
