import {
  intro,
  outro,
  confirm,
  select,
  spinner,
  isCancel,
  cancel,
  text,
} from "@clack/prompts";
import { setTimeout as sleep } from "timers/promises";
import color from "picocolors";

import { parseArgs } from "util";

export const NoConfigFileProvidedMsg = "No configuration file provided";
export const AdditionalArgsMsg = "Additional arguments will be ignored.";
export const NotValidJsonMsg = "Not a valid JSON file";

export function readPositionalFile(positionals: string[]): {
  success: boolean;
  message?: string;
  positional?: string;
} {
  if (positionals.length < 2) {
    console.error("This should not happen");
    return { success: false, message: "This should not happen" };
  }

  if (positionals.length === 2) {
    return { success: false, message: NoConfigFileProvidedMsg };
  }

  if (positionals.length > 3) {
    return {
      success: true,
      message: AdditionalArgsMsg,
      positional: positionals[2],
    };
  }

  return { success: true, positional: positionals[2] };
}

export async function parsePositionalFile(
  path: string
): Promise<{ success: boolean; message?: string; body?: any }> {
  const file = Bun.file(path);

  try {
    const contents = await file.json();
    console.log("contents", contents);
    return { success: true, body: contents };
  } catch (error) {
    return { success: false, message: NotValidJsonMsg };
  }
}

async function main() {
  const { positionals } = parseArgs({
    args: Bun.argv,
    strict: true,
    allowPositionals: true,
  });

  const readPosRes = readPositionalFile(positionals);
  if (!readPosRes.success) {
    console.error(readPosRes.message);
    return process.exit(1);
  }

  if (readPosRes.message) {
    console.warn(readPosRes.message);
  }

  const configFile = readPosRes.positional;

  console.log();
  intro(color.inverse(" create-my-app "));

  const name = await text({
    message: "What is your name?",
    placeholder: "Anonymous",
  });

  if (isCancel(name)) {
    cancel("Operation cancelled");
    return process.exit(0);
  }

  const shouldContinue = await confirm({
    message: "Do you want to continue?",
  });

  if (!shouldContinue) {
    cancel("Operation cancelled");
    return process.exit(0);
  }

  const projectType = await select({
    message: "Pick a project type.",
    options: [
      { value: "ts", label: "TypeScript" },
      { value: "js", label: "JavaScript" },
      { value: "coffee", label: "CoffeeScript", hint: "oh no" },
    ],
  });

  if (isCancel(projectType)) {
    cancel("Operation cancelled");
    return process.exit(0);
  }

  const s = spinner();
  s.start("Installing via npm");

  await sleep(3000);

  s.stop("Installed via npm");

  outro("You're all set!");

  await sleep(1000);
}

main().catch(console.error);
