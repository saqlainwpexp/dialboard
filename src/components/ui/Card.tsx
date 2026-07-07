import { type ReactNode } from "react";
import clsx from "clsx";

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("bg-surface rounded-3xl card-shadow", className)}>
      {children}
    </div>
  );
}
