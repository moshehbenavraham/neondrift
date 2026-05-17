import { useRef, useLayoutEffect, useState, useCallback, type ReactNode } from "react";
import gsap from "gsap";

interface ViewTransitionProps {
  showAlternate: boolean;
  primary: ReactNode;
  alternate: ReactNode;
}

const ViewTransition = ({ showAlternate, primary, alternate }: ViewTransitionProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const primaryRef = useRef<HTMLDivElement>(null);
  const alternateRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const [displayAlternate, setDisplayAlternate] = useState(showAlternate);

  const cleanup = useCallback(() => {
    if (tlRef.current) {
      tlRef.current.kill();
      tlRef.current = null;
    }
  }, []);

  useLayoutEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      setDisplayAlternate(showAlternate);
      return;
    }

    cleanup();

    const outgoing = showAlternate ? primaryRef.current : alternateRef.current;
    const incoming = showAlternate ? alternateRef.current : primaryRef.current;
    const container = containerRef.current;

    if (!outgoing || !incoming || !container) return;

    // Lock container height
    const currentHeight = container.offsetHeight;
    gsap.set(container, { height: currentHeight, overflow: "hidden" });

    // Ensure outgoing is visible, incoming is hidden
    gsap.set(outgoing, { display: "block", opacity: 1 });
    gsap.set(incoming, { display: "none", opacity: 0 });

    const tl = gsap.timeline({
      onComplete: () => {
        // Explicitly hide outgoing, clear inline styles on incoming & container
        gsap.set(outgoing, { display: "none", clearProps: "opacity" });
        gsap.set(incoming, { clearProps: "all" });
        gsap.set(container, { clearProps: "all" });
        tlRef.current = null;
      },
    });
    tlRef.current = tl;

    // Phase 1: fade out outgoing
    tl.to(outgoing, { opacity: 0, duration: 0.25, ease: "power2.in" });

    // Swap: update React state & show incoming (still at opacity 0)
    tl.call(() => {
      gsap.set(outgoing, { display: "none" });
      gsap.set(incoming, { display: "block", opacity: 0 });
      setDisplayAlternate(showAlternate);
    });

    // Phase 2: fade in incoming
    tl.to(incoming, { opacity: 1, duration: 0.3, ease: "power2.out" });

    return () => cleanup();
  }, [showAlternate, cleanup]);

  return (
    <div ref={containerRef}>
      <div ref={primaryRef} style={{ display: displayAlternate ? "none" : undefined }}>
        {primary}
      </div>
      <div ref={alternateRef} style={{ display: !displayAlternate ? "none" : undefined }}>
        {alternate}
      </div>
    </div>
  );
};

export default ViewTransition;
