"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Bot, X } from "lucide-react";
import { getHost } from "@/lib/agent/webmcp";
import { TOOLS } from "@/lib/agent/tools";
import { TASKS, runTask, useRun } from "@/lib/agent/demo";

/**
 * The agent's side of the page. Registers the five tools with the browser on
 * mount (WebMCP, where the browser has it) and shows them, the demo agent's tasks,
 * and every call it makes. Present on every page, like the cart.
 */
const noSubscribe = () => () => {};

export function AgentPanel() {
  const [open, setOpen] = useState(false);
  // Whether the browser exposes WebMCP; fixed for the life of the page.
  const runtime = useSyncExternalStore(noSubscribe, () => getHost().runtime, () => "local" as const);
  const run = useRun();

  useEffect(() => {
    const host = getHost();
    const off = TOOLS.map((t) => host.register(t));
    return () => off.forEach((f) => f());
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn fixed bottom-5 right-5 z-40 shadow-lg" data-testid="agent-open" aria-expanded={open}>
        <Bot className="size-4" aria-hidden /> Your agent
      </button>

      {open && (
        <aside
          role="dialog"
          aria-modal="false"
          aria-labelledby="agent-title"
          className="agent-in fixed inset-y-0 right-0 z-50 flex w-full max-w-[440px] flex-col bg-[var(--color-ink)] text-[var(--color-ink-fg)] shadow-2xl"
          data-testid="agent-panel"
        >
          <div className="flex items-center justify-between px-6 pb-2 pt-5">
            <h2 id="agent-title" className="display text-[22px]">
              Your agent
            </h2>
            <button type="button" onClick={() => setOpen(false)} className="grid size-10 place-items-center transition-colors hover:bg-white/10" aria-label="Close">
              <X className="size-5" aria-hidden />
            </button>
          </div>

          <div className="thin-scroll flex-1 space-y-8 overflow-y-auto px-6 pb-8">
            <p className="text-[15px]" data-testid="agent-runtime">
              {runtime === "webmcp"
                ? "Connected: tools are registered with this browser's agent (WebMCP)."
                : "No AI agent is connected to this tab. These are the real tools this page offers agents; the demo agent calls them exactly as an agent would."}
            </p>

            <section aria-labelledby="tools-h">
              <h3 id="tools-h" className="text-[17px] font-semibold">
                Tools on this page
              </h3>
              <ul className="mt-3 space-y-2" data-testid="agent-tools">
                {TOOLS.map((t) => (
                  <li key={t.name} className="bg-white/[0.07] px-3 py-2.5">
                    <p className="font-semibold">{t.title}</p>
                    <p className="mt-0.5 text-[13px] opacity-85">{t.description}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-3 bg-[var(--color-ink-fg)] px-3 py-2.5 font-semibold text-[var(--color-ink)]" data-testid="agent-no-pay">
                No payment tool. Paying stays with you.
              </p>
            </section>

            <section aria-labelledby="tasks-h">
              <h3 id="tasks-h" className="text-[17px] font-semibold">
                Give the demo agent a task
              </h3>
              <div className="mt-3 grid gap-2">
                {TASKS.map((t) => (
                  <button
                    key={t.label}
                    type="button"
                    disabled={run?.busy}
                    onClick={() => runTask(t)}
                    className="btn btn-invert justify-start text-left"
                    data-testid="agent-task"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </section>

            {run && (
              <section aria-labelledby="calls-h" aria-live="polite">
                <h3 id="calls-h" className="text-[17px] font-semibold">
                  Tool calls
                </h3>
                <p className="mt-1 text-[13px] opacity-85">Task: {run.task}</p>
                <ol className="mt-3 space-y-2" data-testid="agent-calls">
                  {run.calls.map((c, i) => (
                    <li key={i} className={`px-3 py-2.5 ${c.refused ? "bg-[var(--color-danger-soft)] text-[var(--color-danger)]" : "bg-white/[0.07]"}`} data-testid="agent-call" data-tool={c.tool}>
                      <p className="font-semibold">{c.title}</p>
                      {Object.keys(c.input).length > 0 && (
                        <p className="mt-0.5 break-all text-[13px] opacity-85">
                          {Object.entries(c.input).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                        </p>
                      )}
                      <p className="mt-1 text-[13px]">{c.result}</p>
                    </li>
                  ))}
                  {run.busy && <li className="px-3 py-2.5 text-[13px] opacity-85">Working…</li>}
                </ol>
                {run.reply && (
                  <p className="mt-4 bg-[var(--color-ink-fg)] px-3 py-3 text-[15px] text-[var(--color-ink)]" data-testid="agent-reply">
                    {run.reply}
                  </p>
                )}
              </section>
            )}
          </div>
        </aside>
      )}
    </>
  );
}
