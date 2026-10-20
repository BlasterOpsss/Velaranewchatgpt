import { STEPS } from "@/lib/velara/model";

export function Steps({ className = "" }: { className?: string }) {
  return (
    <ol className={className}>
      {STEPS.map((step) => (
        <li key={step.n} className="border-t border-line py-4 first:border-t-0 first:pt-0">
          <p className="font-mono text-xs text-faint">{step.n}</p>
          <p className="mt-2 text-sm text-paper">{step.title}</p>
          <p className="mt-1 text-sm leading-6 text-mist">{step.body}</p>
        </li>
      ))}
    </ol>
  );
}
