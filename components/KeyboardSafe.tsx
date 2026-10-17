"use client";

import { Component, type ErrorInfo, type ReactNode, Suspense, useEffect, useState } from "react";
import dynamic from "next/dynamic";

const FrozenKeyboard = dynamic(() => import("@/components/FrozenKeyboard"), {
  ssr: false,
  loading: () => <div className="keyboard-fallback" aria-hidden />,
});

type Props = {
  mobile?: boolean;
  children?: ReactNode;
};

type State = { failed: boolean };

function hasWebGL(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return !!(
      canvas.getContext("webgl2", { failIfMajorPerformanceCaveat: false }) ||
      canvas.getContext("webgl", { failIfMajorPerformanceCaveat: false }) ||
      canvas.getContext("experimental-webgl")
    );
  } catch {
    return false;
  }
}

class KeyboardErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn("3D keyboard failed to load:", error, info);
  }

  render() {
    if (this.state.failed) {
      return <div className="keyboard-fallback keyboard-fallback--error" aria-hidden />;
    }
    return this.props.children;
  }
}

export default function KeyboardSafe({ mobile = false }: { mobile?: boolean }) {
  const [webgl, setWebgl] = useState<boolean | null>(null);

  useEffect(() => {
    setWebgl(hasWebGL());
  }, []);

  if (webgl === null) {
    return <div className="keyboard-fallback" aria-hidden />;
  }

  if (!webgl) {
    return <div className="keyboard-fallback keyboard-fallback--error" aria-hidden />;
  }

  return (
    <KeyboardErrorBoundary>
      <Suspense fallback={<div className="keyboard-fallback" aria-hidden />}>
        <FrozenKeyboard mobile={mobile} />
      </Suspense>
    </KeyboardErrorBoundary>
  );
}
