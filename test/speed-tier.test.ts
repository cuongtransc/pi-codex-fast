import assert from "node:assert/strict";
import { test } from "node:test";

import { serviceTierFor } from "../lib/speed-tier.ts";

test("off never sets a tier", () => {
	assert.equal(serviceTierFor({ mode: "off", sessionModel: "openai-codex/gpt-6.1-sol", payloadModel: "gpt-6.1-sol" }), undefined);
});

test("a concrete session model keeps the original behaviour", () => {
	assert.equal(serviceTierFor({ mode: "fast", sessionModel: "openai-codex/gpt-6-sol", payloadModel: "gpt-6-sol" }), "priority");
	assert.equal(serviceTierFor({ mode: "ultrafast", sessionModel: "openai-codex/gpt-6.1-sol", payloadModel: "gpt-6.1-sol" }), "ultrafast");
	assert.equal(serviceTierFor({ mode: "ultrafast", sessionModel: "openai-codex/gpt-6-sol", payloadModel: "gpt-6-sol" }), undefined);
});

test("an alias session (pi-model-fallback-alias) matches on the request's own model", () => {
	assert.equal(serviceTierFor({ mode: "fast", sessionModel: "alias/high-model", payloadModel: "gpt-6.1-sol" }), "priority");
	assert.equal(serviceTierFor({ mode: "fast", sessionModel: "alias/mid-model", payloadModel: "deepseek-v4.1-flash" }), undefined);
	assert.equal(serviceTierFor({ mode: "fast", sessionModel: "alias/mid-model", payloadModel: "claude-sonnet-5-5" }), undefined);
	assert.equal(serviceTierFor({ mode: "fast", sessionModel: "alias/mid-model", payloadModel: undefined }), undefined);
});

test("the models allowlist narrows which models get a tier", () => {
	const models = ["gpt-6.1-sol", "openai-codex/gpt-6-luna"];
	assert.equal(serviceTierFor({ mode: "fast", sessionModel: "alias/high-model", payloadModel: "gpt-6.1-sol", models }), "priority");
	assert.equal(serviceTierFor({ mode: "fast", sessionModel: "alias/scout", payloadModel: "gpt-6-luna", models }), "priority");
	assert.equal(serviceTierFor({ mode: "fast", sessionModel: "alias/mid-model", payloadModel: "gpt-6-sol", models }), undefined);
	assert.equal(serviceTierFor({ mode: "fast", sessionModel: "openai-codex/gpt-6-sol", payloadModel: "gpt-6-sol", models }), undefined);
});

test("the allowlist cannot add a model the tier does not support", () => {
	assert.equal(serviceTierFor({ mode: "ultrafast", sessionModel: "alias/x", payloadModel: "gpt-6-luna", models: ["gpt-6-luna"] }), undefined);
	assert.equal(serviceTierFor({ mode: "fast", sessionModel: "alias/x", payloadModel: "gpt-4o", models: ["gpt-4o"] }), undefined);
});
