import { useEffect, useLayoutEffect } from "react";

const isClient = typeof window === "object";
export const useIsomorphicLayoutEffect = isClient ? useLayoutEffect : useEffect;
