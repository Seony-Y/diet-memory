import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import "./pwa-install.css";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const isStandalone = () =>
  globalThis.matchMedia("(display-mode: standalone)").matches ||
  ("standalone" in navigator && navigator.standalone === true);

const isIosDevice = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

export function PwaInstallPrompt() {
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const ios = isIosDevice();

  useEffect(() => {
    if (isStandalone()) return;

    const captureInstallEvent = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    const hideAfterInstall = () => setDismissed(true);

    globalThis.addEventListener("beforeinstallprompt", captureInstallEvent);
    globalThis.addEventListener("appinstalled", hideAfterInstall);
    return () => {
      globalThis.removeEventListener(
        "beforeinstallprompt",
        captureInstallEvent,
      );
      globalThis.removeEventListener("appinstalled", hideAfterInstall);
    };
  }, []);

  if (dismissed || isStandalone() || (!installEvent && !ios)) return null;

  const install = async () => {
    if (!installEvent) {
      setShowIosGuide(true);
      return;
    }
    await installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    setInstallEvent(null);
    if (outcome === "accepted") setDismissed(true);
  };

  return (
    <aside className="pwa-install" aria-label="Diet Memory 앱 설치">
      <img src="/pwa-192x192.png" alt="" />
      <div className="pwa-install-copy">
        <strong>Diet Memory 앱 설치</strong>
        <span>
          {showIosGuide
            ? "Safari 공유 버튼을 누른 뒤 ‘홈 화면에 추가’를 선택하세요."
            : "홈 화면에서 앱처럼 빠르게 기록하세요."}
        </span>
      </div>
      {!showIosGuide && (
        <button className="pwa-install-action" type="button" onClick={install}>
          {ios ? <Share size={16} /> : <Download size={16} />}
          {ios ? "설치 방법" : "설치"}
        </button>
      )}
      <button
        className="pwa-install-close"
        type="button"
        aria-label="설치 안내 닫기"
        onClick={() => setDismissed(true)}
      >
        <X size={17} />
      </button>
    </aside>
  );
}
