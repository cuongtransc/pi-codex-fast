// Which service tier, if any, a provider request gets. Pure: no pi imports, so it is unit-tested.

export const SPEED_MODE = { OFF: "off", FAST: "fast", ULTRAFAST: "ultrafast" } as const;
export type SpeedMode = (typeof SPEED_MODE)[keyof typeof SPEED_MODE];

const OPENAI_PROVIDERS = ["openai", "openai-codex"];

export const FAST_MODELS = [
	"gpt-5.4",
	"gpt-5.5",
	"gpt-5.6-sol",
	"gpt-5.6-terra",
	"gpt-5.6-luna",
	"gpt-6-astra",
	"gpt-6-sol",
	"gpt-6-luna",
	"gpt-6.1-sol",
].flatMap((model) => OPENAI_PROVIDERS.map((provider) => `${provider}/${model}`));

export const ULTRAFAST_MODELS = [
	"openai/gpt-5.6-sol",
	"openai/gpt-6-astra",
	"openai-codex/gpt-6-astra",
	"openai/gpt-6.1-sol",
	"openai-codex/gpt-6.1-sol",
];

function bareId(model: string): string {
	const slash = model.indexOf("/");
	return slash === -1 ? model : model.slice(slash + 1);
}

export interface TierInput {
	mode: SpeedMode;
	/** `provider/id` of the session model; an alias (pi-model-fallback-alias) when routing is on. */
	sessionModel: string | undefined;
	/** The `model` field of the request payload: the concrete target an alias resolved to. */
	payloadModel: unknown;
	/** Optional `pi-codex-fast.models`: bare ids or `provider/id`; only these get a tier. */
	models?: readonly string[];
}

export function serviceTierFor({ mode, sessionModel, payloadModel, models }: TierInput): "priority" | "ultrafast" | undefined {
	if (mode === SPEED_MODE.OFF) return undefined;
	const supported = mode === SPEED_MODE.FAST ? FAST_MODELS : ULTRAFAST_MODELS;

	let target: string | undefined;
	if (sessionModel !== undefined && supported.includes(sessionModel)) {
		target = sessionModel;
	} else if (typeof payloadModel === "string") {
		// The payload carries a bare id; an alias session never names an OpenAI provider itself.
		target = supported.find((model) => bareId(model) === payloadModel);
	}
	if (target === undefined) return undefined;

	// A payload match only knows the bare id, so there the allowlist compares bare ids too.
	const fromPayload = target !== sessionModel;
	const allowedMatch = (allowed: string) =>
		allowed === target || allowed === bareId(target) || (fromPayload && bareId(allowed) === bareId(target));
	if (models !== undefined && !models.some(allowedMatch)) return undefined;
	return mode === SPEED_MODE.FAST ? "priority" : "ultrafast";
}

export function modelsFromSettings(extensionSettings: Record<string, unknown> | null): string[] | undefined {
	const models = extensionSettings?.models;
	if (!Array.isArray(models)) return undefined;
	return models.filter((model): model is string => typeof model === "string");
}
