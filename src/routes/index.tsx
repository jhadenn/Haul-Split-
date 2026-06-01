import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Plus, Trash2, RotateCcw, Package } from "lucide-react";
import { SHIPPING_LINES, type ShippingLine } from "@/lib/shipping-lines";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Haul Split — Superbuy Shipping Calculator" },
      {
        name: "description",
        content:
          "Step-by-step shipping cost calculator for Chinese warehouse agent hauls. Split EMS shipping with friends in CNY.",
      },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
    ],
  }),
  component: Index,
});

const fmt = (n: number) =>
  new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);

type Person = { name: string; weight: string };

const STEPS = ["Line", "People", "Weights", "Estimate", "Result"] as const;

function Index() {
  const [step, setStep] = useState(0);
  const [lineId, setLineId] = useState<string>(SHIPPING_LINES[0].id);
  const [people, setPeople] = useState<Person[]>([
    { name: "You", weight: "" },
    { name: "", weight: "" },
  ]);
  const [estimatedWeight, setEstimatedWeight] = useState("");
  const [serviceFees, setServiceFees] = useState("0");
  const [agentTotalCost, setAgentTotalCost] = useState("");

  const line = SHIPPING_LINES.find((l) => l.id === lineId)!;

  const results = useMemo(
    () => computeShares(line, people, estimatedWeight, serviceFees),
    [line, people, estimatedWeight, serviceFees],
  );

  const canNext = (() => {
    if (step === 0) return !!lineId;
    if (step === 1) return people.length >= 1 && people.every((p) => p.name.trim().length > 0);
    if (step === 2) return people.every((p) => parseFloat(p.weight) > 0);
    if (step === 3) {
      const est = parseFloat(estimatedWeight) || 0;
      return est > 0 && est >= results.sumOfPeople;
    }
    return true;
  })();

  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));
  const reset = () => {
    setStep(0);
    setLineId(SHIPPING_LINES[0].id);
    setPeople([
      { name: "You", weight: "" },
      { name: "", weight: "" },
    ]);
    setEstimatedWeight("");
    setServiceFees("0");
    setAgentTotalCost("");
  };

  return (
    <main className="min-h-screen px-4 py-6 md:py-12">
      <div className="mx-auto max-w-2xl">
        <Header step={step} />

        <div className="border-2 border-foreground bg-card p-5 md:p-8" style={{ boxShadow: "var(--nb-shadow-lg)" }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              {step === 0 && <StepLine lineId={lineId} setLineId={setLineId} />}
              {step === 1 && <StepPeople people={people} setPeople={setPeople} />}
              {step === 2 && <StepWeights people={people} setPeople={setPeople} />}
              {step === 3 && (
                <StepEstimate
                  estimatedWeight={estimatedWeight}
                  setEstimatedWeight={setEstimatedWeight}
                  serviceFees={serviceFees}
                  setServiceFees={setServiceFees}
                  agentTotalCost={agentTotalCost}
                  setAgentTotalCost={setAgentTotalCost}
                  sumOfPeople={results.sumOfPeople}
                />
              )}
              {step === 4 && <StepResult line={line} results={results} agentTotalCost={agentTotalCost} />}
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 flex items-center justify-between gap-3">
            {step > 0 ? (
              <NbButton variant="ghost" onClick={back}>
                <ArrowLeft className="h-4 w-4" /> Back
              </NbButton>
            ) : (
              <span />
            )}
            {step < STEPS.length - 1 ? (
              <NbButton onClick={next} disabled={!canNext}>
                Next <ArrowRight className="h-4 w-4" />
              </NbButton>
            ) : (
              <NbButton onClick={reset} variant="accent">
                <RotateCcw className="h-4 w-4" /> Start over
              </NbButton>
            )}
          </div>
        </div>

        <footer className="mt-8 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
          built for the boys · prices in 人民币
        </footer>
      </div>
    </main>
  );
}

/* ---------------- header / progress ---------------- */

function Header({ step }: { step: number }) {
  return (
    <header className="mb-6">
      <div className="mb-4 flex items-center gap-3">
        <div
          className="flex h-11 w-11 items-center justify-center border-2 border-foreground bg-primary text-primary-foreground"
          style={{ boxShadow: "var(--nb-shadow-sm)" }}
        >
          <Package className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">HAUL SPLIT</h1>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Chinese warehouse agent calculator
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-1.5">
            <div className={`h-2 flex-1 border-2 border-foreground ${i <= step ? "bg-primary" : "bg-surface"}`} />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] font-bold uppercase tracking-wider">
        {STEPS.map((label, i) => (
          <span key={label} className={i === step ? "text-primary" : "text-muted-foreground"}>
            {label}
          </span>
        ))}
      </div>
    </header>
  );
}

/* ---------------- step 0: line ---------------- */

function StepLine({ lineId, setLineId }: { lineId: string; setLineId: (v: string) => void }) {
  return (
    <div>
      <StepTitle q="Which shipping line?" hint="Pick the EMS line your agent quoted." />
      <div className="mt-5 grid gap-4">
        {SHIPPING_LINES.map((l) => {
          const selected = l.id === lineId;
          return (
            <motion.button
              key={l.id}
              type="button"
              onClick={() => setLineId(l.id)}
              whileTap={{ scale: 0.98 }}
              className={`border-2 border-foreground p-4 text-left transition-all ${
                selected ? "bg-primary text-primary-foreground" : "bg-surface hover:-translate-y-0.5"
              }`}
              style={{ boxShadow: selected ? "var(--nb-shadow)" : "var(--nb-shadow-sm)" }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-base font-bold uppercase tracking-tight">{l.name}</div>
                  <div className={`mt-1 text-xs ${selected ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                    {l.description}
                  </div>
                </div>
                {selected && (
                  <div className="flex h-6 w-6 items-center justify-center border-2 border-foreground bg-background text-foreground">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] font-mono font-bold uppercase">
                <Stat label="Initial" value={`¥${l.initialFee}`} dark={selected} />
                <Stat label={`First ${l.initialCoveredGrams}g`} value="incl." dark={selected} />
                <Stat label="Op fee" value={`¥${l.operationFee}`} dark={selected} />
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value, dark }: { label: string; value: string; dark?: boolean }) {
  return (
    <div className={`border-2 border-foreground px-2 py-1 ${dark ? "bg-background text-foreground" : "bg-surface-2"}`}>
      <div className="text-[9px] opacity-70">{label}</div>
      <div>{value}</div>
    </div>
  );
}

/* ---------------- step 1: people ---------------- */

function StepPeople({ people, setPeople }: { people: Person[]; setPeople: (p: Person[]) => void }) {
  const add = () => setPeople([...people, { name: "", weight: "" }]);
  const remove = (i: number) => setPeople(people.length > 1 ? people.filter((_, idx) => idx !== i) : people);
  const update = (i: number, name: string) => setPeople(people.map((p, idx) => (idx === i ? { ...p, name } : p)));

  return (
    <div>
      <StepTitle q="Who's splitting the haul?" hint="Add a name for everyone in the group, including yourself." />
      <div className="mt-5 space-y-3">
        {people.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center border-2 border-foreground bg-accent font-mono text-sm font-bold">
              {i + 1}
            </div>
            <NbInput
              value={p.name}
              onChange={(v) => update(i, v)}
              placeholder={i === 0 ? "Your name" : `Friend ${i + 1} name`}
            />
            {people.length > 1 && (
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label="Remove person"
                className="flex h-11 w-11 shrink-0 items-center justify-center border-2 border-foreground bg-surface hover:bg-primary hover:text-primary-foreground"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={add}
        className="mt-4 flex w-full items-center justify-center gap-2 border-2 border-dashed border-foreground bg-surface-2 py-3 text-sm font-bold uppercase tracking-wider hover:bg-accent"
      >
        <Plus className="h-4 w-4" /> Add person
      </button>
    </div>
  );
}

/* ---------------- step 2: weights ---------------- */

function StepWeights({ people, setPeople }: { people: Person[]; setPeople: (p: Person[]) => void }) {
  const update = (i: number, weight: string) =>
    setPeople(people.map((p, idx) => (idx === i ? { ...p, weight: weight.replace(/[^\d.]/g, "") } : p)));
  const sum = people.reduce((s, p) => s + (parseFloat(p.weight) || 0), 0);

  return (
    <div>
      <StepTitle q="How much does each person's items weigh?" hint="Enter each person's item weight in grams (g)." />
      <div className="mt-5 space-y-3">
        {people.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="flex h-11 min-w-11 items-center justify-center border-2 border-foreground bg-accent px-3 font-mono text-sm font-bold">
              {p.name || `#${i + 1}`}
            </div>
            <NbInput
              value={p.weight}
              onChange={(v) => update(i, v)}
              placeholder="e.g. 3500"
              suffix="g"
              inputMode="decimal"
            />
          </div>
        ))}
      </div>
      <div
        className="mt-5 flex items-center justify-between border-2 border-foreground bg-surface-2 p-3 text-sm font-bold uppercase"
        style={{ boxShadow: "var(--nb-shadow-sm)" }}
      >
        <span>Sum of items</span>
        <span className="font-mono">{sum.toLocaleString()} g</span>
      </div>
    </div>
  );
}

/* ---------------- step 3: estimate ---------------- */

function StepEstimate({
  estimatedWeight,
  setEstimatedWeight,
  serviceFees,
  setServiceFees,
  agentTotalCost,
  setAgentTotalCost,
  sumOfPeople,
}: {
  estimatedWeight: string;
  setEstimatedWeight: (v: string) => void;
  serviceFees: string;
  setServiceFees: (v: string) => void;
  agentTotalCost: string;
  setAgentTotalCost: (v: string) => void;
  sumOfPeople: number;
}) {
  const est = parseFloat(estimatedWeight) || 0;
  const diff = Math.max(0, est - sumOfPeople);
  const tooLow = est > 0 && est < sumOfPeople;
  return (
    <div>
      <StepTitle
        q="What's the agent's estimated total weight?"
        hint="This is the total weight your warehouse agent quoted (packaging adds weight)."
      />
      <div className="mt-5 space-y-4">
        <Labeled label="Agent's estimated total">
          <NbInput
            value={estimatedWeight}
            onChange={(v) => setEstimatedWeight(v.replace(/[^\d.]/g, ""))}
            placeholder={`Minimum ${sumOfPeople.toLocaleString()}`}
            suffix="g"
            inputMode="decimal"
          />
        </Labeled>
        {tooLow && (
          <div
            className="border-2 border-foreground bg-primary p-3 text-xs font-bold text-primary-foreground"
            style={{ boxShadow: "var(--nb-shadow-sm)" }}
          >
            Must be at least {sumOfPeople.toLocaleString()}g (sum of all items).
          </div>
        )}
        <Labeled label="Service fees (optional, total ¥)">
          <NbInput
            value={serviceFees}
            onChange={(v) => setServiceFees(v.replace(/[^\d.]/g, ""))}
            placeholder="0"
            suffix="¥"
            inputMode="decimal"
          />
        </Labeled>
        <Labeled label="Agent's quoted total cost (optional, total ¥)">
          <NbInput
            value={agentTotalCost}
            onChange={(v) => setAgentTotalCost(v.replace(/[^\d.]/g, ""))}
            placeholder="e.g. 1450"
            suffix="¥"
            inputMode="decimal"
          />
        </Labeled>

        <div className="grid grid-cols-2 gap-3">
          <Mini label="Sum of items" value={`${sumOfPeople.toLocaleString()} g`} />
          <Mini label="Unaccounted" value={`${diff.toLocaleString()} g`} highlight={diff > 0} />
        </div>
        {diff > 0 && (
          <p className="text-xs text-muted-foreground">
            The extra <span className="font-bold text-foreground">{diff.toLocaleString()}g</span> (packaging /
            mis-estimate) is split evenly across everyone.
          </p>
        )}
      </div>
    </div>
  );
}

function Mini({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={`border-2 border-foreground p-3 ${highlight ? "bg-primary text-primary-foreground" : "bg-surface-2"}`}
    >
      <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">{label}</div>
      <div className="mt-0.5 font-mono text-base font-bold">{value}</div>
    </div>
  );
}

/* ---------------- step 4: results ---------------- */

function StepResult({
  line,
  results,
  agentTotalCost,
}: {
  line: ShippingLine;
  results: ReturnType<typeof computeShares>;
  agentTotalCost: string;
}) {
  const agentCost = parseFloat(agentTotalCost) || 0;
  const diff = agentCost - results.grandTotal;
  const hasAgentCost = agentCost > 0;
  return (
    <div>
      <StepTitle q="Here's everyone's share" hint={`On ${line.name} · all prices in CNY`} />
      <div className="mt-5 space-y-3">
        {results.shares.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="border-2 border-foreground bg-surface p-4"
            style={{ boxShadow: "var(--nb-shadow-sm)" }}
          >
            <div className="flex items-baseline justify-between gap-3">
              <div>
                <div className="text-base font-bold uppercase">{s.name}</div>
                <div className="font-mono text-[11px] text-muted-foreground">{s.weight.toLocaleString()} g</div>
              </div>
              <div className="font-mono text-2xl font-bold text-primary">{fmt(s.total)}</div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-1.5 text-[11px] font-mono md:grid-cols-4">
              <Tag label="Initial ÷" value={fmt(s.initialShare)} />
              <Tag label="Weight" value={fmt(s.weightCost)} />
              <Tag label="Op fee" value={fmt(s.opFee)} />
              <Tag label="Packaging weight" value={fmt(s.diffShare + s.serviceShare)} />
            </div>
          </motion.div>
        ))}
      </div>

      <div
        className="mt-5 border-2 border-foreground bg-foreground p-4 text-background"
        style={{ boxShadow: "var(--nb-shadow-red)" }}
      >
        <div className="flex items-center justify-between text-sm font-bold uppercase tracking-wider">
          <span>Group total</span>
          <span className="font-mono text-xl text-primary">{fmt(results.grandTotal)}</span>
        </div>
      </div>

      {hasAgentCost && (
        <div className="mt-3 border-2 border-foreground bg-surface p-4" style={{ boxShadow: "var(--nb-shadow-sm)" }}>
          <div className="flex items-center justify-between text-sm font-bold uppercase tracking-wider">
            <span>Agent quoted</span>
            <span className="font-mono text-xl">{fmt(agentCost)}</span>
          </div>
          {Math.abs(diff) > 0.01 && (
            <div
              className={`mt-2 flex items-center justify-between border-2 border-foreground p-2 text-xs font-bold uppercase ${diff > 0 ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"}`}
            >
              <span>{diff > 0 ? "Agent quoted higher by" : "You calculated higher by"}</span>
              <span className="font-mono">{fmt(Math.abs(diff))}</span>
            </div>
          )}
          {Math.abs(diff) <= 0.01 && (
            <div className="mt-2 flex items-center justify-between border-2 border-foreground bg-accent p-2 text-xs font-bold uppercase text-accent-foreground">
              <span>Matches agent quote</span>
              <Check className="h-3.5 w-3.5" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Tag({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-foreground bg-surface-2 px-2 py-1">
      <div className="text-[9px] uppercase opacity-70">{label}</div>
      <div className="font-bold">{value}</div>
    </div>
  );
}

/* ---------------- primitives ---------------- */

function StepTitle({ q, hint }: { q: string; hint?: string }) {
  return (
    <div>
      <h2 className="text-xl font-bold leading-tight md:text-2xl">{q}</h2>
      {hint && <p className="mt-1.5 text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
      {children}
    </label>
  );
}

function NbInput({
  value,
  onChange,
  placeholder,
  suffix,
  inputMode,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  suffix?: string;
  inputMode?: "text" | "decimal";
}) {
  return (
    <div className="relative w-full">
      <input
        value={value}
        inputMode={inputMode ?? "text"}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full border-2 border-foreground bg-input px-3 pr-10 text-base font-medium outline-none transition-shadow placeholder:text-muted-foreground/60 focus:bg-accent/40"
        style={{ boxShadow: "var(--nb-shadow-sm)" }}
      />
      {suffix && (
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center font-mono text-xs font-bold text-muted-foreground">
          {suffix}
        </span>
      )}
    </div>
  );
}

function NbButton({
  children,
  onClick,
  disabled,
  variant = "primary",
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: "primary" | "ghost" | "accent";
}) {
  const styles =
    variant === "primary"
      ? "bg-primary text-primary-foreground"
      : variant === "accent"
        ? "bg-accent text-accent-foreground"
        : "bg-surface text-foreground";
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.97, x: 3, y: 3, boxShadow: "0 0 0 0 #000" }}
      className={`inline-flex items-center gap-2 border-2 border-foreground px-4 py-2.5 text-sm font-bold uppercase tracking-wider transition-all ${styles} disabled:cursor-not-allowed disabled:opacity-40`}
      style={{ boxShadow: disabled ? "var(--nb-shadow-sm)" : "var(--nb-shadow)" }}
    >
      {children}
    </motion.button>
  );
}

/* ---------------- calculation ---------------- */

function computeShares(line: ShippingLine, people: Person[], estimatedWeight: string, serviceFees: string) {
  const n = Math.max(1, people.length);
  const est = parseFloat(estimatedWeight) || 0;
  const fees = parseFloat(serviceFees) || 0;
  const weights = people.map((p) => parseFloat(p.weight) || 0);
  const sumOfPeople = weights.reduce((a, b) => a + b, 0);
  const diff = Math.max(0, est - sumOfPeople);

  // Initial fee covers the first `initialCoveredGrams` of the TOTAL shipment.
  // Each person gets an equal share of that covered weight.
  const coveredPerPerson = line.initialCoveredGrams / n;
  const initialShare = line.initialFee / n;
  const diffShare = (line.ratePer500g * (diff / 500)) / n;
  const serviceShare = fees / n;

  const shares = people.map((p, i) => {
    const w = weights[i];
    const billable = Math.max(0, w - coveredPerPerson);
    const weightCost = line.ratePer500g * (billable / 500);
    const opFee = line.operationFee / n;
    const total = initialShare + weightCost + opFee + diffShare + serviceShare;
    return {
      name: p.name || `Person ${i + 1}`,
      weight: w,
      initialShare,
      weightCost,
      opFee,
      diffShare,
      serviceShare,
      total,
    };
  });

  const grandTotal = shares.reduce((s, x) => s + x.total, 0);
  return { shares, sumOfPeople, grandTotal };
}
