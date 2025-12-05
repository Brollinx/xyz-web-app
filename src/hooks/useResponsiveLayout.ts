import * as React from "react";

const MD_BREAKPOINT = 768; // Corresponds to 'md' in Tailwind CSS

export function useResponsiveLayout() {
  const [layout, setLayout] = React.useState<"mobile" | "desktop">("desktop");

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MD_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setLayout(mql.matches ? "mobile" : "desktop");
    };
    mql.addEventListener("change", onChange);
    onChange(); // Set initial value
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return layout;
}