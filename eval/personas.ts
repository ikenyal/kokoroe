/**
 * Persona simulation (Kento 11/5): how well does the mechanism hold up when the people vary? NOT a substitute for a real-world
 * test — a check of tolerance to variation. The master-role test (Kento's own measured session) is a separate thing.
 *
 * What stays fixed (no AI grading AI):
 *   - What is right is decided by the frozen hidden kokoroe (data/hidden) and the machine judge, exactly as in the evaluation.
 *   - A persona only changes how the master expresses it: whether and how a remark is said, how ○△× is shown (wobble, slips),
 *     which reading is tapped by mistake — and, for the successor, how a question is asked.
 *   - Wording (long stories, abbreviations, question styles) is written by a cheap model (Haiku) from the machine's own remark /
 *     question, cached in eval/personas-texts.json (committed), so a rerun reuses the same text. Random choices use fixed seeds.
 *
 *   npx tsx --env-file-if-exists=.env.local eval/personas.ts            # plan + cost estimate, no API
 *   npx tsx --env-file-if-exists=.env.local eval/personas.ts --yes      # run (stops at $9.5 estimated spend)
 * Output: docs/results/personas-<date>.json (+ grown kokoroe-chō in eval/runs/raw/personas/, gitignored). Fictional data.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { CLIENTS, EVAL_SCENES, getClient, HISTORY_QUESTIONS, TRAIN_SCENES } from "@/src/core/world";
import type { Client, Proposal, Scene, Verdict } from "@/src/core/types";
import type { Usage } from "@/src/disciple/v0";
import { makeDiscipleV1 } from "@/src/disciple/v1";
import { seedFromLedger } from "@/src/learning/ledger";
import { LocalJsonStore } from "@/src/learning/store";
import type { Candidate } from "@/src/learning/types";
import { getClaude, MODELS, usageOf } from "@/src/lib/claude";
import { estimateUsd } from "@/src/lib/cost";
import { askSuccessor } from "@/src/successor/ask";
import { runOnce } from "./evaluate";
import { pct } from "./metrics";
import { HISTORY_ANSWERS } from "./simulator/hidden";
import { createSimulatedMaster, hiddenRuleFixedBy, type SimulatedMaster } from "./simulator/master";
import { rng } from "./simulator/remark";
import { trainScenes } from "./training";

const SEED = 101; // the same training path for every persona: differences come from the persona, not the path
const EVAL_SEED = 7;
const BUDGET_USD = 9.5;
const ROOT = path.join(__dirname, "..");
const RAW = path.join(__dirname, "runs", "raw", "personas");
const TEXTS = path.join(__dirname, "personas-texts.json");

// ---------- cheap, cached wording ----------
const usage: Usage[] = [];
let capUsd = Infinity;
/** Stop before a call when the spend so far reaches the cap. */
const guard = () => {
  if (estimateUsd(usage) >= capUsd) throw new Error(`stopped at the cap ($${capUsd}): $${estimateUsd(usage).toFixed(3)} spent`);
};
const cache: Record<string, string> = existsSync(TEXTS) ? JSON.parse(readFileSync(TEXTS, "utf8")) : {};
const saveCache = () => writeFileSync(TEXTS, JSON.stringify(Object.fromEntries(Object.entries(cache).sort()), null, 2) + "\n");

async function write(key: string, instruction: string, source: string): Promise<string> {
  if (cache[key]) return cache[key]; // an empty cached text (a failed generation) is generated again
  guard();
  const t0 = performance.now();
  const res = await getClaude().messages.create({
    model: MODELS.simulator,
    max_tokens: 1500, // 400 left 20 of 130 texts empty in the first run (the budget was used before any text came out)
    system: "あなたは日本の中小企業の人物を演じる台詞書きです。指示どおりの台詞だけを、日本語で、前置きや引用符なしで1つ書いてください。",
    messages: [{ role: "user", content: `${instruction}\n\n元の内容：${source}` }],
  });
  usage.push(usageOf(res, performance.now() - t0));
  const text = res.content.map((b) => (b.type === "text" ? b.text : "")).join("").trim().replace(/^「|」$/g, "");
  if (!text) throw new Error(`empty text for ${key} (stop_reason ${res.stop_reason})`); // never let an empty text stand in for a persona
  cache[key] = text;
  return text;
}

// ---------- master personas ----------
export type MasterPersona = "textbook" | "silent" | "story" | "vague" | "busy" | "fatfinger" | "abbrev";
export const MASTER_PERSONAS: { id: MasterPersona; name: string; how: string }[] = [
  { id: "textbook", name: "教科書どおりの師匠", how: "今の機械の師匠（基準）" },
  { id: "silent", name: "背中で語る師匠", how: "一言をほぼ付けない（1割だけ）。△はほとんど使わず×にする（8割）。「なぜ」には答えない" },
  { id: "story", name: "昔話の師匠", how: "一言が長い武勇伝。肝心な点は最後の一文だけ" },
  { id: "vague", name: "「なんか違う」の師匠", how: "×や△は付けるが「違う」「そうじゃない」しか言わない。「なぜ」には答えない" },
  { id: "busy", name: "繁忙期の師匠", how: "繁忙の月（取引先の繁忙月と3月）は△を半分○にする。余裕のある月は○の15%を△（「もう一工夫」）にする" },
  { id: "fatfinger", name: "指が太い師匠", how: "5%で隣の印を押す（○↔△、△↔×）。読み方の候補も5%で隣を押す" },
  { id: "abbrev", name: "略語の師匠", how: "一言と「なぜ」から固有名や主語を省く（「浜風は前もって言うとけ」「例の件」「あそこ」）" },
];

const VAGUE = ["違う", "そうじゃない", "違うな", "そうじゃないんだよ"];

/** The machine master, with the persona laid over what it says and taps. Verdict truth and the failing log stay the machine's. */
export function personaMaster(id: MasterPersona, seed = SEED): SimulatedMaster & { slips: () => { verdict: number; reading: number } } {
  const base = createSimulatedMaster(seed);
  const rand = rng(seed * 31 + id.length);
  let slips = { verdict: 0, reading: 0 };
  let n = 0;
  const neighbor = (v: Verdict): Verdict => (v === "○" ? "△" : v === "×" ? "△" : rand() < 0.5 ? "○" : "×");
  return {
    ...base,
    slips: () => slips,
    async judge(scene: Scene, client: Client, proposal: Proposal) {
      const r = await base.judge(scene, client, proposal);
      const k = `${id}:${scene.id}:${n++}`;
      let { verdict, remark } = r;
      switch (id) {
        case "silent":
          if (verdict === "△" && rand() < 0.8) verdict = "×";
          if (rand() >= 0.1) remark = "";
          break;
        case "story":
          if (verdict !== "○")
            remark = await write(`story:${k}`, "昔の取引先との思い出話を3〜4文で語り、最後の一文でだけ、元の内容をそのまま言う師匠の台詞を書いてください。元の内容が空なら、要点のない昔話だけにしてください。", remark || "（なし）");
          break;
        case "vague":
          if (verdict !== "○") remark = VAGUE[Math.floor(rand() * VAGUE.length)];
          break;
        case "busy": {
          const busy = client.busyMonths.includes(scene.month) || scene.month === 3;
          if (busy && verdict === "△" && rand() < 0.5) { verdict = "○"; remark = ""; }
          else if (!busy && verdict === "○" && rand() < 0.15) { verdict = "△"; remark = "もう一工夫"; }
          break;
        }
        case "fatfinger":
          if (rand() < 0.05) { verdict = neighbor(verdict); slips = { ...slips, verdict: slips.verdict + 1 }; if (verdict === "○") remark = ""; }
          break;
        case "abbrev":
          if (remark) remark = await write(`abbrev:${k}`, "元の内容を、取引先の正式名や主語を省いた短い口語に言い換えてください（例：「浜風は前もって言うとけ」「例の件」「あそこ」）。", `取引先：${client.name}。一言：${remark}`);
          break;
      }
      return { verdict, remark };
    },
    async choose(args: { scene: Scene; client: Client; proposal: Proposal; candidates: Candidate[] }) {
      const pick = await base.choose(args);
      if (id === "fatfinger" && pick !== null && args.candidates.length > 1 && rand() < 0.05) {
        slips = { ...slips, reading: slips.reading + 1 };
        return (pick + 1) % args.candidates.length;
      }
      return pick;
    },
    async why(args) {
      const w = await base.why(args);
      if (id === "silent" || id === "vague") return "";
      if (!w) return w;
      if (id === "story") return write(`story-why:${args.client.id}:${args.rule.id}`, "そうなった経緯を、昔話として2〜3文で語り、最後の一文でだけ元の内容をそのまま言う台詞にしてください。", w);
      if (id === "abbrev") return write(`abbrev-why:${args.client.id}:${args.rule.id}`, "元の内容を、主語や固有名を省いた短い口語に言い換えてください。年はそのまま残してください。", w);
      return w;
    },
  };
}

// ---------- successor personas ----------
export const SUCCESSOR_PERSONAS = [
  { id: "plain", name: "そのまま（基準）", how: "質問の元の文" },
  { id: "shy", name: "遠慮がちな新人", how: "遠回しで敬語が多い" },
  { id: "former", name: "前職の常識で聞く中途", how: "「普通は〜ですよね？」と前職の当たり前を前提にする" },
  { id: "terse", name: "一行で雑に聞く人", how: "「浜風 遅延 どうする」のような単語の羅列" },
  { id: "outsider", name: "別部署から来た人", how: "業界の言葉や社内の言い回しを知らず、言い換えて聞く" },
] as const;

const STYLE: Record<string, string> = {
  shy: "遠慮がちな新人が、先輩の後任に遠回しに、敬語を多めに使って聞く形に言い換えてください。聞いている中身（はい/いいえで答えられる問い）は変えないでください。",
  former: "前の会社の常識を前提に「普通は〜ですよね？」と確かめる形に言い換えてください。聞いている中身は変えないでください。",
  terse: "単語を並べた一行のメモのように、助詞をほとんど省いて言い換えてください（例：「浜風 遅延 どうする」）。取引先の名前は残してください。",
  outsider: "業界や社内の言葉を知らない別部署の人が、平易な言葉に言い換えて聞く形にしてください。取引先の名前は残してください。",
};

// ---------- runs ----------
interface MasterResult {
  persona: MasterPersona;
  match: number;
  okp: number;
  taps: number;
  rulesActive: number;
  wrongRules: { id: string; text: string }[];
  rolledBack: number;
  withdrawn: number;
  noneOfThese: number;
  asked: number;
  slips: { verdict: number; reading: number };
  usd: number;
}

async function runMaster(id: MasterPersona): Promise<MasterResult> {
  mkdirSync(RAW, { recursive: true });
  const file = path.join(RAW, `${id}.store.json`);
  const store = new LocalJsonStore(file);
  if (existsSync(file)) writeFileSync(file, JSON.stringify({ rules: [], judgments: [] }));
  const master = personaMaster(id);
  const ledger = await seedFromLedger({ store, clients: CLIENTS, master });
  const log: string[] = [];
  const t = await trainScenes({ store, scenes: TRAIN_SCENES, seed: SEED, master, generalize: true, log: (l) => log.push(l) });
  writeFileSync(path.join(RAW, `${id}.train.log`), log.join("\n") + "\n");
  const d = makeDiscipleV1(store, "v1-kokoroe");
  const run = await runOnce(d, EVAL_SCENES, EVAL_SEED, 4);
  // A learned rule is "wrong" when the reading it came from would not have cleared any of the master's actual (machine) failures.
  const judgments = await store.listJudgments();
  const rules = (await store.listRules()).filter((r) => r.status === "active");
  const wrongRules = rules
    .filter((r) => r.fix && r.sources.some((s) => s.kind !== "ledger"))
    .filter((r) => {
      const src = r.sources.find((s) => s.kind !== "ledger")!;
      const j = judgments.find((x) => x.id === src.judgmentId);
      const scene = TRAIN_SCENES.find((s) => s.id === src.sceneId);
      return !!j && !!scene && hiddenRuleFixedBy(scene, getClient(scene.clientId), j.proposal, r.fix!) === null;
    })
    .map((r) => ({ id: r.id, text: r.text }));
  const usd = estimateUsd(t.discipleUsage) + estimateUsd(t.interpUsage) + estimateUsd(d.usage);
  return {
    persona: id,
    match: run.total.matchRate,
    okp: run.total.okOrPartialRate,
    taps: t.taps + ledger.asked,
    rulesActive: rules.length,
    wrongRules,
    rolledBack: t.steps.filter((s) => s.verification?.rolledBack).length,
    withdrawn: t.steps.filter((s) => s.verification?.withdrawn).length,
    noneOfThese: t.steps.filter((s) => s.asked && s.chosen === null).length,
    asked: t.steps.filter((s) => s.asked).length,
    slips: master.slips(),
    usd: Number(usd.toFixed(3)),
  };
}

async function runSuccessors(storeFile: string) {
  const store = new LocalJsonStore(storeFile);
  const rules = (await store.listRules()).filter((r) => r.status === "active");
  const forClient = (cid: string) => rules.filter((r) => r.scope.clientId === null || r.scope.clientId === cid);
  const notCovered = JSON.parse(readFileSync(path.join(ROOT, "data", "scenes", "unknown-questions.json"), "utf8")) as { id: string; clientId: string; question: string }[];
  const out = [];
  const only = process.env.PERSONA_SUCCESSORS?.split(",");
  for (const p of SUCCESSOR_PERSONAS.filter((x) => !only || only.includes(x.id))) {
    const ask = async (key: string, q: string, cid: string) => {
      const asked = p.id === "plain" ? q : await write(`succ:${p.id}:${key}`, STYLE[p.id], `取引先：${getClient(cid).name}。質問：${q}`);
      guard();
      const a = await askSuccessor({ client: getClient(cid), question: asked, rules: forClient(cid), usage });
      return { asked, a };
    };
    const history = await Promise.all(
      HISTORY_QUESTIONS.map(async (q) => {
        const { asked, a } = await ask(q.id, q.question, q.clientId);
        const key = HISTORY_ANSWERS[q.id];
        const answerOk = a.answer === key.expectedAnswer;
        const missing = key.keywordGroups.filter((g) => !g.some((kw) => a.explanation.includes(kw)));
        return { id: q.id, asked, answer: a.answer, ok: answerOk && missing.length === 0 && a.citationsValid, answerOk };
      }),
    );
    const nc = await Promise.all(
      notCovered.map(async (q) => {
        const { asked, a } = await ask(q.id, q.question, q.clientId);
        return { id: q.id, asked, answer: a.answer, madeUp: a.answer !== "unknown", citations: a.citations.map((c) => c.ruleId) };
      }),
    );
    out.push({
      persona: p.id, name: p.name,
      history: history.filter((h) => h.ok).length, answerOk: history.filter((h) => h.answerOk).length,
      madeUp: nc.filter((x) => x.madeUp).length, notCovered: nc.length, detail: { history, notCovered: nc },
    });
    console.log(`successor ${p.name.padEnd(12)} history ${history.filter((h) => h.ok).length}/8  made up ${nc.filter((x) => x.madeUp).length}/${nc.length}`);
  }
  return out;
}

async function main() {
  const { values } = parseArgs({ options: { yes: { type: "boolean", default: false }, only: { type: "string" }, parallel: { type: "string", default: "3" }, "successors-only": { type: "string" } } });
  // Second part on its own: the successor personas on the textbook master's grown 心得帳, with a hard cap on what is left of the budget.
  if (values["successors-only"] !== undefined) {
    const cap = Number(values["successors-only"]);
    console.log(`successor personas only; hard cap $${cap}`);
    if (!values.yes) return console.log("Not called. Add --yes.");
    capUsd = cap;
    const successors = await runSuccessors(path.join(RAW, "textbook.store.json"));
    saveCache();
    const date = new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);
    const out = path.join(ROOT, "docs", "results", `personas-successors-${date}.json`);
    writeFileSync(out, JSON.stringify({ at: new Date().toISOString(), note: "fictional data; successor personas on the textbook master's grown 心得帳 (seed 101)", usd: Number(estimateUsd(usage).toFixed(3)), successors }, null, 2) + "\n");
    return console.log(`≈ $${estimateUsd(usage).toFixed(3)} → ${path.relative(ROOT, out)}`);
  }
  const masters = MASTER_PERSONAS.filter((p) => !values.only || values.only.split(",").includes(p.id));
  console.log(`master personas: ${masters.map((m) => m.name).join(" / ")} — one training path each (seed ${SEED}), held-out ×1`);
  console.log(`successor personas: ${SUCCESSOR_PERSONAS.map((p) => p.name).join(" / ")} — on the textbook master's grown 心得帳`);
  console.log(`estimate: about $1.1 per training path × ${masters.length} + successors ≈ $0.5 → ≈ $${(1.1 * masters.length + 0.5).toFixed(1)}; stops at $${BUDGET_USD}`);
  if (!values.yes) return console.log("Not called. Add --yes.");

  const results: MasterResult[] = [];
  let spent = 0;
  const queue = [...masters];
  await Promise.all(
    Array.from({ length: Number(values.parallel) }, async () => {
      for (let m = queue.shift(); m; m = queue.shift()) {
        if (spent + estimateUsd(usage) > BUDGET_USD - 1.2) { console.log(`skip ${m.name}: budget`); continue; }
        const r = await runMaster(m.id);
        results.push(r);
        spent += r.usd;
        saveCache();
        console.log(`${m.name.padEnd(12)} match ${pct(r.match)} ○+△ ${pct(r.okp)} taps ${r.taps} rules ${r.rulesActive} wrong ${r.wrongRules.length} rolled-back ${r.rolledBack} withdrawn ${r.withdrawn} none ${r.noneOfThese}/${r.asked} slips ${JSON.stringify(r.slips)} $${r.usd}  (total ≈ $${(spent + estimateUsd(usage)).toFixed(2)})`);
      }
    }),
  );
  const textbook = path.join(RAW, "textbook.store.json");
  const successors = existsSync(textbook) && spent + estimateUsd(usage) < BUDGET_USD - 0.6 ? await runSuccessors(textbook) : [];
  saveCache();
  const total = spent + estimateUsd(usage);
  const date = new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);
  const out = path.join(ROOT, "docs", "results", `personas-${date}.json`);
  writeFileSync(out, JSON.stringify({
    at: new Date().toISOString(),
    note: "fictional data; persona simulation — tolerance to variation, not a real-world test. Correctness by the frozen hidden kokoroe and the machine judge; personas change only expression. One training path per master persona (seed 101), held-out ×1.",
    usd: Number(total.toFixed(3)),
    masters: MASTER_PERSONAS.map((p) => ({ ...p, result: results.find((r) => r.persona === p.id) ?? null })),
    successors,
  }, null, 2) + "\n");
  console.log(`total ≈ $${total.toFixed(2)} → ${path.relative(ROOT, out)}`);
}

if (require.main === module)
  main().catch((e) => {
    saveCache();
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  });
