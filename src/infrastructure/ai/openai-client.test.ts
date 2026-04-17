import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AiSummaryDataset } from "@/domain/ai";
import { callOpenAi } from "./openai-client";

const dataset: AiSummaryDataset = {
  total: 10,
  bySource: {
    instagram: 5,
    facebook: 2,
    landing_page: 1,
    referido: 1,
    otro: 1,
  },
  averageBudget: 1000,
  lastSevenDays: 5,
  previousSevenDays: 2,
  withBudget: 8,
  withoutBudget: 2,
  topProducts: [{ label: "Curso", count: 3 }],
};

const filters = { source: "all" as const, from: null, to: null };

describe("callOpenAi", () => {
  const fetchSpy = vi.spyOn(globalThis, "fetch");

  beforeEach(() => {
    fetchSpy.mockReset();
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_MODEL;
  });

  it("returns no_key when OPENAI_API_KEY is missing", async () => {
    const outcome = await callOpenAi({ dataset, filters });
    expect(outcome.status).toBe("no_key");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns ok with parsed payload on 200 + valid JSON", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    const payload = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              headline: "10 leads activos",
              analysis: "Volumen saludable.",
              topSource: "instagram",
              recommendations: ["Duplicar Instagram", "Follow-up rápido"],
            }),
          },
        },
      ],
    };
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const outcome = await callOpenAi({ dataset, filters });
    expect(outcome.status).toBe("ok");
    if (outcome.status === "ok") {
      expect(outcome.parsed.headline).toBe("10 leads activos");
      expect(outcome.parsed.topSource).toBe("instagram");
      expect(outcome.parsed.recommendations).toHaveLength(2);
    }
  });

  it("returns http_error with OpenAI message on 401", async () => {
    process.env.OPENAI_API_KEY = "sk-bad";
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ error: { message: "Invalid API key" } }),
        { status: 401, statusText: "Unauthorized" },
      ),
    );

    const outcome = await callOpenAi({ dataset, filters });
    expect(outcome.status).toBe("http_error");
    if (outcome.status === "http_error") {
      expect(outcome.reason).toContain("401");
      expect(outcome.reason).toContain("Invalid API key");
    }
  });

  it("returns invalid_response when model returns malformed JSON", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: "not json at all" } }],
        }),
        { status: 200 },
      ),
    );

    const outcome = await callOpenAi({ dataset, filters });
    expect(outcome.status).toBe("invalid_response");
  });

  it("accepts response with topSource omitted (regression: Devin Review PR #8)", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  headline: "Resumen sin topSource",
                  analysis: "El modelo omitió el campo topSource.",
                  recommendations: ["Hacer algo", "Hacer algo más"],
                }),
              },
            },
          ],
        }),
        { status: 200 },
      ),
    );

    const outcome = await callOpenAi({ dataset, filters });
    expect(outcome.status).toBe("ok");
    if (outcome.status === "ok") {
      expect(outcome.parsed.topSource ?? null).toBeNull();
    }
  });

  it("returns invalid_response when JSON is missing required keys", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  headline: "ok",
                  // missing analysis + recommendations
                }),
              },
            },
          ],
        }),
        { status: 200 },
      ),
    );

    const outcome = await callOpenAi({ dataset, filters });
    expect(outcome.status).toBe("invalid_response");
  });

  it("returns network_error when fetch itself throws", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    fetchSpy.mockRejectedValueOnce(new Error("ECONNRESET"));

    const outcome = await callOpenAi({ dataset, filters });
    expect(outcome.status).toBe("network_error");
    if (outcome.status === "network_error") {
      expect(outcome.reason).toContain("ECONNRESET");
    }
  });
});
