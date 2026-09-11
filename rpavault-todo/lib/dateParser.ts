import * as chrono from "chrono-node";
import { format } from "date-fns";

export interface ParsedTaskInput {
  cleanText: string;
  dueDate: string | null;
}

export function parseNaturalLanguageTask(input: string): ParsedTaskInput {
  const parsed = chrono.parse(input);
  if (!parsed || parsed.length === 0) {
    return {
      cleanText: input.trim(),
      dueDate: null,
    };
  }

  const firstResult = parsed[0];
  const date = firstResult.date();
  const hasTime = firstResult.start.isCertain("hour");

  let dueDate: string;
  if (hasTime) {
    dueDate = format(date, "yyyy-MM-dd'T'HH:mm:ss");
  } else {
    dueDate = format(date, "yyyy-MM-dd");
  }

  // Remove the parsed date text from the task title
  const textBefore = input.substring(0, firstResult.index);
  const textAfter = input.substring(firstResult.index + firstResult.text.length);
  const cleanText = `${textBefore} ${textAfter}`.replace(/\s+/g, " ").trim();

  return {
    cleanText: cleanText || input.trim(),
    dueDate,
  };
}
