import { useRef, useEffect, memo } from "react";

declare global {
  interface Window {
    hcaptcha: any;
    onHCaptchaLoad: () => void;
    onHCaptchaSuccess: (token: string) => void;
    onHCaptchaError: () => void;
    onHCaptchaExpire: () => void;
  }
}

interface CaptchaProps {
  onSuccess: (token: string) => void;
  onError: () => void;
  onExpire: () => void;
}

const Captcha = memo(({ onSuccess, onError, onExpire }: CaptchaProps) => {
  const captchaRef = useRef<HTMLDivElement>(null);
  const captchaWidgetId = useRef<string | null>(null);

  useEffect(() => {
    // Define callbacks in window for hCaptcha
    window.onHCaptchaSuccess = (token: string) => {
      onSuccess(token);
    };
    window.onHCaptchaError = () => {
      onError();
    };
    window.onHCaptchaExpire = () => {
      onExpire();
    };

    const renderCaptcha = () => {
      if (
        captchaRef.current &&
        window.hcaptcha &&
        captchaWidgetId.current === null
      ) {
        const sitekey = import.meta.env.VITE_HCAPTCHA_SITEKEY;
        if (!sitekey) {
          console.error("hCaptcha sitekey non configurada. Configura VITE_HCAPTCHA_SITEKEY no .env");
          return;
        }
        captchaWidgetId.current = window.hcaptcha.render(captchaRef.current, {
          sitekey: sitekey,
          callback: "onHCaptchaSuccess",
          "expired-callback": "onHCaptchaExpire",
          "error-callback": "onHCaptchaError",
          tabindex: -1,
          // Web3Forms recommends reCaptchaCompat: false for React
          "recaptchacompat": "off"
        });
      }
    };

    // Load hCaptcha script if not already loaded
    // Note: hl=gl forces Galician language
    if (!document.getElementById("hcaptcha-script")) {
      const script = document.createElement("script");
      script.id = "hcaptcha-script";
      script.src = "https://js.hcaptcha.com/1/api.js?render=explicit&onload=onHCaptchaLoad&hl=gl";
      script.async = true;
      script.defer = true;
      window.onHCaptchaLoad = renderCaptcha;
      document.body.appendChild(script);
    } else if (window.hcaptcha) {
      // Script already loaded, render directly
      renderCaptcha();
    } else {
      // Script tag exists but not yet loaded, wait for onload
      window.onHCaptchaLoad = renderCaptcha;
    }

    return () => {
      // Cleanup on unmount
      if (captchaWidgetId.current !== null && window.hcaptcha) {
        try {
          window.hcaptcha.reset(captchaWidgetId.current);
        } catch (_) {
          // ignore
        }
        captchaWidgetId.current = null;
      }
    };
  }, [onSuccess, onError, onExpire]);

  return (
    <div className="flex flex-col items-center gap-4 my-4">
      <div className="flex justify-center min-h-[78px]">
        <div ref={captchaRef}></div>
      </div>
      <div className="text-xs text-muted-foreground text-center max-w-sm">
        <p>
          Se tes dificultades visuais, podes solicitar un <a href="https://www.hcaptcha.com/accessibility" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">captcha de accesibilidade</a> na web oficial de hCaptcha.
        </p>
      </div>
    </div>
  );
});

export default Captcha;
