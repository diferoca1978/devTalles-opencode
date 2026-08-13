import { describe, expect, test } from "bun:test";
import { dispatch, main, type CliDependencies } from "../src/index";
import type { AppState } from "../src/types";
import { makeState } from "./support/fixtures";

function makeDependencies(
  inputs: Array<string | null>,
  handler?: (state: AppState) => Promise<void>,
) {
  const state = makeState();
  const events: string[] = [];
  const deps: CliDependencies = {
    loadState: async () => {
      events.push("loadState");
      return state;
    },
    printMenu: () => events.push("printMenu"),
    prompt: (message) => {
      events.push(`prompt:${message}`);
      const input = inputs.shift();
      return input === undefined ? null : input;
    },
    isExit: (option) => option === "9",
    isValidOption: (option) => option === "1" || option === "9",
    getHandler: (option) => (option === "1" ? handler : undefined),
    printSeparator: () => events.push("separator"),
    log: (...messages) => events.push(`log:${messages.join(" ")}`),
  };

  return { deps, events, state };
}

describe("CLI entrypoint", () => {
  test("returns cleanly when input is cancelled", async () => {
    const { deps, events } = makeDependencies([null]);

    await main(deps);

    expect(events).toEqual([
      "loadState",
      "printMenu",
      "prompt:  Selecciona una opción: ",
      "log:",
      "log:  ¡Hasta luego!",
    ]);
  });

  test("prints an error for invalid options and continues until exit", async () => {
    const { deps, events } = makeDependencies(["0", "9"]);

    await main(deps);

    expect(events).toEqual([
      "loadState",
      "printMenu",
      "prompt:  Selecciona una opción: ",
      "log:",
      "log:  Opción inválida. Intenta de nuevo.",
      "separator",
      "printMenu",
      "prompt:  Selecciona una opción: ",
      "log:",
      "log:  ¡Hasta luego!",
    ]);
  });

  test("dispatches a valid option and then returns on exit", async () => {
    let handlerCalls = 0;
    const { deps, events, state } = makeDependencies(["1", "9"], async (received) => {
      handlerCalls += 1;
      expect(received).toBe(state);
    });

    await main(deps);

    expect(handlerCalls).toBe(1);
    expect(events).toContain("separator");
    expect(events.at(-1)).toBe("log:  ¡Hasta luego!");
  });

  test("dispatch ignores an option without a handler", async () => {
    const state = makeState();
    const resolveHandler = () => undefined;

    await expect(dispatch("9", state, resolveHandler)).resolves.toBeUndefined();
  });
});
