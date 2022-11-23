import type { ReactNode } from "react";

interface ChipPops {
  children: ReactNode;
  as?: "li";
}

export function Chip({ children, as: asElement }: ChipPops) {
  const Wrapper = asElement ?? "div";
  return (
    <Wrapper className="chip">
      <small>{children}</small>
    </Wrapper>
  );
}
