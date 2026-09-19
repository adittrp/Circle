import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";

export function EmptyState({
  title,
  body,
  actionLabel,
  actionHref,
  onAction,
}: {
  title: string;
  body: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}) {
  let action: ReactNode = null;
  if (actionLabel && actionHref) {
    action = (
      <Link href={actionHref}>
        <Button>{actionLabel}</Button>
      </Link>
    );
  } else if (actionLabel && onAction) {
    action = <Button onClick={onAction}>{actionLabel}</Button>;
  }

  return (
    <div className="py-10 text-center sm:py-12">
      <h2 className="text-section">{title}</h2>
      <p className="text-body-secondary mx-auto mt-2 max-w-sm">{body}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
