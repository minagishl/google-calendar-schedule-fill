import { createRoot } from "react-dom/client";

import { ExtensionButtons } from "../ui/ExtensionButtons";

const SPIN_ANIMATION = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

export function mountContentScript(
  containerId: string,
  onApplyCalendar: () => Promise<void>
): void {
  const style = document.createElement("style");
  style.textContent = SPIN_ANIMATION;
  document.head.appendChild(style);

  const container = document.createElement("div");
  document.body.appendChild(container);

  const root = createRoot(container);
  root.render(
    <ExtensionButtons
      containerId={containerId}
      onApplyCalendar={onApplyCalendar}
    />
  );
}
