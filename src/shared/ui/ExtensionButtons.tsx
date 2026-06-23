import { Calendar, RotateCcw, X } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import browser from "webextension-polyfill";

import { Button } from "./Button";

interface ExtensionButtonsProps {
  containerId: string;
  onApplyCalendar: () => Promise<void>;
}

export const ExtensionButtons: React.FC<ExtensionButtonsProps> = ({
  containerId,
  onApplyCalendar,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasCachedData, setHasCachedData] = useState(false);
  const [buttonPosition, setButtonPosition] = useState<
    "right-top" | "right-bottom" | "left-top" | "left-bottom"
  >("right-top");
  const [minimalMode, setMinimalMode] = useState(false);

  useEffect(() => {
    (async () => {
      const settings = await browser.storage.local.get([
        "buttonPosition",
        "minimalMode",
      ]);

      if (settings.buttonPosition) {
        setButtonPosition(
          settings.buttonPosition as
            | "right-top"
            | "right-bottom"
            | "left-top"
            | "left-bottom"
        );
      }

      if (settings.minimalMode !== undefined) {
        setMinimalMode(settings.minimalMode as boolean);
      }

      const { icsCache } = await browser.storage.local.get("icsCache");
      setHasCachedData(!!icsCache && Object.keys(icsCache || {}).length > 0);
    })();

    (async () => {
      const result = await browser.storage.local.get("autoApplyCalendar");
      if (result.autoApplyCalendar) {
        setIsLoading(true);
        try {
          await onApplyCalendar();
        } finally {
          setIsLoading(false);
        }
      }
    })();

    const listener = (changes: {
      [key: string]: browser.Storage.StorageChange;
    }) => {
      if (changes.icsCache) {
        const newCache = changes.icsCache.newValue;
        setHasCachedData(!!newCache && Object.keys(newCache || {}).length > 0);
      }
      if (changes.buttonPosition) {
        setButtonPosition(
          changes.buttonPosition.newValue as
            | "right-top"
            | "right-bottom"
            | "left-top"
            | "left-bottom"
        );
      }
      if (changes.minimalMode) {
        setMinimalMode(changes.minimalMode.newValue as boolean);
      }
    };

    browser.storage.onChanged.addListener(listener);

    return () => {
      browser.storage.onChanged.removeListener(listener);
    };
  }, [onApplyCalendar]);

  const handleApplyCalendar = async () => {
    setIsLoading(true);
    try {
      await onApplyCalendar();
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearCache = async () => {
    setHasCachedData(false);
    await browser.runtime.sendMessage({ type: "CLEAR_ICS_CACHE" });
  };

  const handleResetUrl = () => {
    if (window.confirm("Are you sure you want to reset all calendar URLs?")) {
      browser.storage.local
        .remove(["icsCache", "icsCacheTimestamp", "icsUrl", "calendarUrls"])
        .then(() => {
          alert("Calendar URLs have been reset.");
        });
    }
  };

  return (
    <div
      id={containerId}
      style={{
        position: "fixed",
        ...(buttonPosition === "right-top" && { top: "20px", right: "20px" }),
        ...(buttonPosition === "right-bottom" && {
          bottom: "20px",
          right: "20px",
        }),
        ...(buttonPosition === "left-top" && { top: "20px", left: "20px" }),
        ...(buttonPosition === "left-bottom" && {
          bottom: "20px",
          left: "20px",
        }),
        display: "flex",
        gap: "8px",
        zIndex: 9999,
      }}
    >
      <Button
        onClick={handleResetUrl}
        variant="danger"
        minimize={minimalMode}
        icon={<X size={18} />}
      >
        Reset URL
      </Button>
      {hasCachedData && (
        <Button
          onClick={handleClearCache}
          variant="warning"
          minimize={minimalMode}
          icon={<RotateCcw size={18} />}
        >
          Clear Cache
        </Button>
      )}
      <Button
        onClick={handleApplyCalendar}
        disabled={isLoading}
        minimize={minimalMode}
        icon={<Calendar size={18} />}
      >
        Apply Calendar
        {isLoading && (
          <div
            style={{
              width: "8px",
              height: "8px",
              border: "1.5px solid #ffffff",
              borderTop: "1.5px solid transparent",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          />
        )}
      </Button>
    </div>
  );
};
