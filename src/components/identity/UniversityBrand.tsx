"use client";

import { useIdentity } from "@/context/IdentityContext";
import { useEffect, type ReactNode } from "react";

export function UniversityBrand({ children }: { children: ReactNode }) {
  const { university } = useIdentity();

  useEffect(() => {
    const root = document.documentElement;
    if (university) {
      root.style.setProperty("--uni-primary", university.primary_color);
      root.style.setProperty("--uni-secondary", university.secondary_color);
      root.dataset.university = university.slug;
    } else {
      root.style.removeProperty("--uni-primary");
      root.style.removeProperty("--uni-secondary");
      delete root.dataset.university;
    }
  }, [university]);

  return <>{children}</>;
}
