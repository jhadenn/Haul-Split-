import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Users, Scale, Ship, Plane, Sparkles } from "lucide-react";
import { SHIPPING_LINES, type ShippingLine } from "@/lib/shipping-lines";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Haul Split — Chinese Warehouse Shipping Calculator" },
      { name: "description", content: "Split shipping costs from your Chinese warehouse agent with friends. Fast, clean, in CNY." },
    ],
  }),
  component: Index,
});

const fmt = (n: number) =>
  new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY", maximumFractionDigits: 2 }).format(
    Number.isFinite(n) ? n : 0,
  );

function Index() {
  const [lineId, setLineId] = useState<string>(SHIPPING_LINES[0].id);
  const [estimatedWeight, setEstimatedWeight] = useState<string>("");
  const [people, setPeople] = useState<string>("2");
  const [totalItemsWeight, setTotalItemsWeight] = useState<string>("");
  const [yourWeight, setYourWeight] = useState<string>("");
  const [serviceFees, setServiceFees] = useState<string>("0");

  const line = SHIPPING_LINES.find((l) => l.id === lineId)!;

  const calc = useMemo(() => {
    const est = parseFloat(estimatedWeight) || 0;
    const n = Math.max(1, parseInt(people) || 1);
    const sumAll = parseFloat(totalItemsWeight) || 0;
    const yours = parseFloat(yourWeight) || 0;
    const fees = parseFloat(serviceFees) || 0;

    const initialShare = line.initialFee / n;
    const yoursCost = line.ratePer500g * (yours / 500);
    const diff = Math.max(0, est - sumAll);
    const diffShareCost = (line.ratePer500g * (diff / 500)) / n;
    const total = initialShare + yoursCost + fees + diffShareCost;

    return { initialShare, yoursCost, fees, diff, diffShareCost, total, n };
  }, [line, estimatedWeight, people, totalItemsWeight, yourWeight, serviceFees]);

  return (
    <main className="min-h-screen px-4 py-10 md:py-16">
      <div className="mx-auto max-w-5xl">
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 flex items-center gap-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Haul Split</h1>
            <p className="text-sm text-muted-foreground">Chinese warehouse agent shipping calculator · CNY</p>
          </div>
        </motion.header>

        <div className="grid gap-6 md:grid-cols-5">
          {/* LEFT — inputs */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="md:col-span-3 space-y-6"
          >
            <Card>
              <SectionTitle icon={<Ship className="h-4 w-4" />} label="Shipping line" />
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {SHIPPING_LINES.map((l) => (
                  <LineOption key={l.id} line={l} selected={lineId === l.id} onSelect={() => setLineId(l.id)} />
                ))}
              </div>
            </Card>

            <Card>
              <SectionTitle icon={<Scale className="h-4 w-4" />} label="Weights & people" />
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field
                  label="Agent's estimated total weight"
                  suffix="g"
                  value={estimatedWeight}
                  onChange={setEstimatedWeight}
                  placeholder="e.g. 12000"
                />
                <Field
                  label="People splitting"
                  icon={<Users className="h-3.5 w-3.5" />}
                  value={people}
                  onChange={setPeople}
                  placeholder="2"
                />
                <Field
                  label="Sum of everyone's items"
                  suffix="g"
                  value={totalItemsWeight}
                  onChange={setTotalItemsWeight}
                  placeholder="e.g. 11000"
                />
                <Field
                  label="Your items weight"
                  suffix="g"
                  value={yourWeight}
                  onChange={setYourWeight}
                  placeholder="e.g. 3500"
                />
                <Field
                  label="Service fees (optional)"
                  suffix="¥"
                  value={serviceFees}
                  onChange={setServiceFees}
                  placeholder="0"
                />
              </div>
            </Card>
          </motion.section>

          {/* RIGHT — result */}
          <motion.aside
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="md:col-span-2"
          >
            <div
              className="sticky top-6 rounded-[var(--radius-xl)] border bg-card p-6"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                <Package className="h-3.5 w-3.5" /> Your share
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={calc.total.toFixed(2)}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="mt-2"
                >
                  <div className="text-4xl font-semibold tracking-tight text-primary md:text-5xl">
                    {fmt(calc.total)}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    on <span className="text-foreground">{line.name}</span> · split {calc.n} ways
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="my-5 h-px bg-border" />

              <Breakdown label={`Initial fee ÷ ${calc.n}`} value={calc.initialShare} />
              <Breakdown label={`Your weight × ¥${line.ratePer500g}/500g`} value={calc.yoursCost} />
              {calc.fees > 0 && <Breakdown label="Service fees" value={calc.fees} />}
              {calc.diff > 0 && (
                <Breakdown
                  label={`Unaccounted ${calc.diff.toFixed(0)}g ÷ ${calc.n}`}
                  value={calc.diffShareCost}
                  hint
                />
              )}

              <div className="mt-5 rounded-lg bg-[var(--color-surface-2)] p-3 text-xs text-muted-foreground">
                {line.id.startsWith("air") ? (
                  <Plane className="mb-1 inline h-3.5 w-3.5 text-primary" />
                ) : (
                  <Ship className="mb-1 inline h-3.5 w-3.5 text-primary" />
                )}{" "}
                <span className="text-foreground">{line.name}</span> · ¥{line.initialFee} initial + ¥
                {line.ratePer500g} per 500g
              </div>
            </div>
          </motion.aside>
        </div>

        <footer className="mt-10 text-center text-xs text-muted-foreground">
          Built for haul splitters · prices in 人民币
        </footer>
      </div>
    </main>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-[var(--radius-xl)] border bg-card p-6"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      {children}
    </div>
  );
}

function SectionTitle({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
      {icon} {label}
    </div>
  );
}

function LineOption({
  line,
  selected,
  onSelect,
}: {
  line: ShippingLine;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileTap={{ scale: 0.98 }}
      className={`relative overflow-hidden rounded-lg border p-4 text-left transition-colors ${
        selected
          ? "border-primary bg-primary/10"
          : "border-border bg-[var(--color-surface)] hover:border-primary/40"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">{line.name}</div>
        {line.id.startsWith("air") ? (
          <Plane className="h-4 w-4 text-muted-foreground" />
        ) : (
          <Ship className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      <div className="mt-0.5 text-xs text-muted-foreground">{line.description}</div>
      <div className="mt-3 text-xs">
        <span className="text-foreground">¥{line.initialFee}</span>
        <span className="text-muted-foreground"> initial · </span>
        <span className="text-foreground">¥{line.ratePer500g}</span>
        <span className="text-muted-foreground">/500g</span>
      </div>
      {selected && (
        <motion.div
          layoutId="line-glow"
          className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-primary/60"
          style={{ boxShadow: "var(--shadow-glow)" }}
        />
      )}
    </motion.button>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  suffix,
  icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  suffix?: string;
  icon?: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="relative">
        <input
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ""))}
          placeholder={placeholder}
          className="w-full rounded-lg border bg-[var(--color-input)] px-3 py-2.5 pr-10 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/30"
        />
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}

function Breakdown({ label, value, hint }: { label: string; value: number; hint?: boolean }) {
  return (
    <div className="flex items-baseline justify-between py-1.5 text-sm">
      <span className={hint ? "text-muted-foreground" : "text-foreground/90"}>{label}</span>
      <span className="font-medium tabular-nums">{fmt(value)}</span>
    </div>
  );
}
