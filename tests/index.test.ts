import { expect, test, describe } from "bun:test";
import {
  readPositionalFile,
  parsePositionalFile,
  NotValidJsonMsg,
  NoConfigFileProvidedMsg,
  AdditionalArgsMsg,
} from "../index.ts";

describe("readPositionalFile", () => {
  test("no positional arg provided", async () => {
    const res = readPositionalFile(["bun", "index.ts"]);
    expect(res.success).toBe(false);
    expect(res.message).toBe(NoConfigFileProvidedMsg);
  });

  test("too many positional arg provided", async () => {
    const res = readPositionalFile(["bun", "index.ts", "config.json", "extra"]);
    expect(res.success).toBe(true);
    expect(res.positional).toBe("config.json");
    expect(res.message).toBe(AdditionalArgsMsg);
  });

  test("positional arg provided", async () => {
    const res = readPositionalFile(["bun", "index.ts", "config.json"]);
    expect(res.success).toBe(true);
    expect(res.positional).toBe("config.json");
  });
});

describe("parsePositionalFile", () => {
  test("file does not exist", async () => {
    const jsonRes = await parsePositionalFile("not-existing");
    expect(jsonRes.success).toBe(false);
    expect(jsonRes.message).toBe(NotValidJsonMsg);
  });

  test("not a json file", async () => {
    const jsonRes = await parsePositionalFile("tests/fixtures/not-json.txt");
    expect(jsonRes.success).toBe(false);
    expect(jsonRes.message).toBe(NotValidJsonMsg);
  });

  test("not a valid json", async () => {
    const jsonRes = await parsePositionalFile("tests/fixtures/bad.json");
    expect(jsonRes.success).toBe(false);
    expect(jsonRes.message).toBe(NotValidJsonMsg);
  });

  test("valid json", async () => {
    const jsonRes = await parsePositionalFile("tests//fixtures/valid.json");
    expect(jsonRes.success).toBe(true);
    expect(jsonRes.body).toEqual({ hello: "world" });
  });
});
