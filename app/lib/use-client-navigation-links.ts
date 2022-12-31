import { useNavigate } from "@remix-run/react";
import { useEffect } from "react";

export function useClientNavigationLinks() {
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();
    document.addEventListener(
      "click",
      (event) => {
        let target = event.target;
        // Find the first parent anchor element
        while (target && target !== document) {
          if (target instanceof HTMLAnchorElement) {
            break;
          }
          target = (target as any)?.parentNode;
        }

        if (!(target instanceof HTMLAnchorElement)) return;

        const url = new URL(target.href, location.origin);
        if (
          url.origin === window.location.origin &&
          // Ignore clicks with modifiers
          !event.ctrlKey &&
          !event.metaKey &&
          !event.shiftKey &&
          // Ignore right clicks
          event.button === 0 &&
          // Ignore if `target="_blank"`
          [null, undefined, "", "self"].includes(target.target)
        ) {
          console.log(
            "Treating anchor as <Link> and navigating to:",
            url.pathname
          );
          event.preventDefault();
          navigate(url.pathname + url.search + url.hash);
        }
      },
      { signal: controller.signal }
    );

    return () => controller.abort();
  });
}
