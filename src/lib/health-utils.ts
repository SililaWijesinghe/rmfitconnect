export function calcBMI(heightCm: number | null | undefined, weightKg: number | null | undefined) {
  if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) return null;
  const m = heightCm / 100;
  return +(weightKg / (m * m)).toFixed(1);
}

export type BmiCategory = {
  label: string;
  color: "green" | "red" | "amber" | "muted";
  cls: string;
};

export function bmiCategory(bmi: number | null): BmiCategory {
  if (bmi === null) return { label: "—", color: "muted", cls: "text-muted-foreground bg-white/5 border-white/10" };
  if (bmi < 18.5) return { label: "Underweight", color: "red", cls: "text-red-400 bg-red-500/10 border-red-500/30" };
  if (bmi < 25) return { label: "Healthy", color: "green", cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" };
  if (bmi < 30) return { label: "Overweight", color: "amber", cls: "text-amber-400 bg-amber-500/10 border-amber-500/30" };
  return { label: "Obese", color: "red", cls: "text-red-400 bg-red-500/10 border-red-500/30" };
}
