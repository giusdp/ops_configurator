import { $ } from "bun";

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

type Prompt = {
  name: string;
  type: string | string[];
  value?: string;
};

const OPS_CMD = process.env.OPS_CMD || "ops";

export const AdditionalArgsMsg = "Additional arguments will be ignored.";
export const NotValidJsonMsg = "Not a valid JSON file";
export const BadConfigMsg = `Bad configuration file. 

The configuration file must be an non-empty JSON with the following structure:
    
{
  "KEY": {
    type: "string"
  },
  "OTHER_KEY": {
    type: "int"
  },
  ...
} 

The value for the "type" key must be either string with the following values:
- string
- int
- float
- bool
- password

or an array of strings with specific values (an enum).
`;

export const HelpMsg = `
TODO: Add help message
`;

async function main() {
  const { positionals } = parseArgs({
    args: Bun.argv,
    strict: true,
    allowPositionals: true,
  });

  // 1. Read input config json
  const readPosRes = readPositionalFile(positionals);
  if (!readPosRes.success) {
    console.error(readPosRes.message);
    return process.exit(1);
  }

  if (readPosRes.help) {
    console.log(readPosRes.help);
    return process.exit(0);
  }

  if (readPosRes.message) {
    console.warn(readPosRes.message);
  }

  // 2. Parse the json
  const jsonRes = await parsePositionalFile(readPosRes.positional!);

  if (!jsonRes.success) {
    console.error(jsonRes.message);
    return process.exit(1);
  }

  const config = jsonRes.body;

  // 3. Validate the given config json
  validateConfigJson(config);

  // 4. Run OPS_CMD to get the available config data
  const { exitCode, stderr, stdout } = await $`${OPS_CMD} -config -d`.nothrow();

  if (exitCode !== 0) {
    console.error(stderr.toString());
    return process.exit(1);
  }

  const opsConfig = stdout.toJSON();

  // 5. Remove the keys from config that are already in the opsConfig
  const missingData = findMissingConfig(config, opsConfig);

  // 6. Ask the user for the missing data

  // 7. Save the data to the config?

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

export function findMissingConfig(
  config: Record<string, any>,
  opsConfig: Record<string, any>
): Record<string, any> {
  let newConfig: Record<string, any> = {};

  for (const key in config) {
    if (key in opsConfig) {
      continue;
    }
    newConfig[key] = config[key];
  }

  return newConfig;
}

export function readPositionalFile(positionals: string[]): {
  success: boolean;
  message?: string;
  help?: string;
  positional?: string;
} {
  if (positionals.length < 2) {
    console.error("This should not happen");
    return { success: false, message: "This should not happen" };
  }

  if (positionals.length === 2) {
    return { success: true, help: HelpMsg };
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
    return { success: true, body: contents };
  } catch (error) {
    return { success: false, message: NotValidJsonMsg };
  }
}

export function validateConfigJson(body: Record<string, any>): {
  success: boolean;
  message?: string;
} {
  // 1. If the body is empty, return false
  if (Object.keys(body).length === 0) {
    return { success: false, message: BadConfigMsg };
  }

  // 2. Check that each key in the body has the keys as the Prompt type
  for (const key in body) {
    const value = body[key];
    if (typeof value !== "object") {
      return { success: false, message: BadConfigMsg };
    }

    if (!value.type) {
      return { success: false, message: BadConfigMsg };
    }

    if (
      !["string", "int", "float", "bool", "password"].includes(value.type) &&
      !Array.isArray(value.type)
    ) {
      return { success: false, message: BadConfigMsg };
    }
  }

  return { success: true };
}

main().catch(console.error);
