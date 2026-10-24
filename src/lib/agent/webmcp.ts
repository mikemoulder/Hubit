"use client";

/**
 * The only file that touches `document.modelContext` (WebMCP). Facts measured on
 * 2026-09-02, in Chrome 152 and ChatGPT's in-app browser, carried over from v1:
 *
 *  1. Late registration works: a tool registered after load can be called.
 *  2. Aborting a registration's signal really removes the tool.
 *  3. `toolchange` is not usable everywhere, so Hubit keeps its own registry.
 *  4. `inputSchema` does not validate: every tool checks its own input.
 *  5. registerTool may return a promise that rejects on abort; that is expected.
 */

export type ToolResult = { content: { type: "text"; text: string }[]; isError?: boolean };

export type ToolDef = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: { readOnlyHint?: boolean };
  execute: (input: unknown) => Promise<ToolResult>;
};

type ModelContextLike = {
  registerTool: (tool: Record<string, unknown>, options?: { signal?: AbortSignal }) => unknown;
};

declare global {
  interface Document {
    modelContext?: ModelContextLike;
  }
}

function modelContext(): ModelContextLike | null {
  if (typeof document === "undefined") return null;
  const mc = document.modelContext;
  return mc && typeof mc.registerTool === "function" ? mc : null;
}

class Host {
  private entries = new Map<string, { def: ToolDef; controller: AbortController }>();

  get runtime(): "webmcp" | "local" {
    return modelContext() ? "webmcp" : "local";
  }

  register(def: ToolDef): () => void {
    this.entries.get(def.name)?.controller.abort();
    const controller = new AbortController();
    this.entries.set(def.name, { def, controller });
    const mc = modelContext();
    if (mc) {
      try {
        const pending = mc.registerTool(
          { name: def.name, description: def.description, inputSchema: def.inputSchema, annotations: def.annotations, execute: (input: unknown) => def.execute(input) },
          { signal: controller.signal },
        );
        if (pending && typeof (pending as PromiseLike<unknown>).then === "function") {
          Promise.resolve(pending).catch((err) => {
            if (!controller.signal.aborted) console.error(`registerTool(${def.name}) rejected`, err);
          });
        }
      } catch (err) {
        console.error(`registerTool(${def.name}) failed`, err);
      }
    }
    return () => {
      controller.abort();
      if (this.entries.get(def.name)?.controller === controller) this.entries.delete(def.name);
    };
  }

  names(): string[] {
    return [...this.entries.keys()];
  }

  /**
   * Calls a tool the way an agent would: only a registered name can be reached, so
   * the demo agent meets exactly the surface a real one does.
   */
  async call(name: string, input: unknown = {}): Promise<ToolResult> {
    const entry = this.entries.get(name);
    if (!entry) {
      const what = /pay|checkout|card|charge/i.test(name) ? "payment tool" : `tool called ${name}`;
      return { content: [{ type: "text", text: `Refused: this page offers agents no ${what}.` }], isError: true };
    }
    return entry.def.execute(input);
  }
}

let host: Host | null = null;
export function getHost(): Host {
  host ??= new Host();
  return host;
}
