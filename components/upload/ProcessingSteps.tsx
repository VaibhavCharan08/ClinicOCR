"use client";

import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { cn } from "@/utils/cn";

export type StepStatus = "pending" | "loading" | "done" | "error";

export interface Step {
  id: string;
  label: string;
  status: StepStatus;
  description?: string;
}

export function ProcessingSteps({ steps }: { steps: Step[] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Processing Steps</h3>
      <div className="space-y-3">
        {steps.map((step, i) => (
          <div key={step.id} className="flex items-start gap-3">
            <div className="mt-0.5">
              {step.status === "done" && (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              )}
              {step.status === "loading" && (
                <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
              )}
              {step.status === "pending" && (
                <Circle className="h-5 w-5 text-slate-300" />
              )}
              {step.status === "error" && (
                <Circle className="h-5 w-5 text-red-400" />
              )}
            </div>
            <div>
              <p
                className={cn(
                  "text-sm font-medium",
                  step.status === "done" && "text-emerald-700",
                  step.status === "loading" && "text-blue-700",
                  step.status === "pending" && "text-slate-400",
                  step.status === "error" && "text-red-600"
                )}
              >
                {step.label}
              </p>
              {step.description && (
                <p className="text-xs text-slate-400 mt-0.5">{step.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
