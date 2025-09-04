import type { ButtonHTMLAttributes } from "react";
export default function Button(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={
        "inline-flex items-center gap-2 rounded-xl px-4 py-2 font-medium shadow-sm " +
        "bg-[var(--color-brand)] text-white hover:opacity-90 disabled:opacity-50 " +
        (props.className ?? "")
      }
    />
  );
}
