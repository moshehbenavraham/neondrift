import { useRef, useEffect } from "react";
import gsap from "gsap";
import { cn } from "@/lib/utils";

type MascotMood = "idle" | "happy" | "celebrate";
type MascotSize = "sm" | "md" | "lg";

interface MascotBuddyProps {
  mood?: MascotMood;
  size?: MascotSize;
  className?: string;
}

const sizeMap: Record<MascotSize, number> = {
  sm: 56,
  md: 80,
  lg: 112,
};

const MascotBuddy = ({ mood = "idle", size = "md", className }: MascotBuddyProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const leftEyeRef = useRef<SVGCircleElement>(null);
  const rightEyeRef = useRef<SVGCircleElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  const px = sizeMap[size];

  useEffect(() => {
    const svg = svgRef.current;
    const leftEye = leftEyeRef.current;
    const rightEye = rightEyeRef.current;
    if (!svg || !leftEye || !rightEye) return;

    const ctx = gsap.context(() => {
      gsap.to(svg, { y: -6, duration: 2, repeat: -1, yoyo: true, ease: "sine.inOut" });
      gsap.to(svg, { rotation: 3, duration: 3, repeat: -1, yoyo: true, ease: "sine.inOut", transformOrigin: "center center" });
      gsap.to([leftEye, rightEye], { scaleY: 0.1, duration: 0.15, repeat: -1, yoyo: true, repeatDelay: 4, transformOrigin: "center center", ease: "power2.inOut" });
    }, svg);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    if (timelineRef.current) timelineRef.current.kill();

    if (mood === "celebrate") {
      const tl = gsap.timeline();
      tl.to(svg, { y: -20, duration: 0.3, ease: "back.out(2)" })
        .to(svg, { rotation: 360, duration: 0.6, ease: "power2.out", transformOrigin: "center center" }, "<")
        .to(svg, { y: 0, rotation: 0, duration: 0.4, ease: "bounce.out" });
      timelineRef.current = tl;
    } else if (mood === "happy") {
      const tl = gsap.timeline();
      tl.to(svg, { scale: 1.1, duration: 0.3, yoyo: true, repeat: 1, ease: "back.out(2)", transformOrigin: "center center" });
      timelineRef.current = tl;
    }
  }, [mood]);

  return (
    <svg
      ref={svgRef}
      width={px}
      height={px}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("select-none drop-shadow-[0_0_16px_hsl(270_100%_65%_/_0.4)]", className)}
      aria-hidden="true"
    >
      {/* Gradient body */}
      <defs>
        <linearGradient id="mascot-body-gradient" x1="12" y1="10" x2="68" y2="54" gradientUnits="userSpaceOnUse">
          <stop stopColor="hsl(270, 100%, 65%)" />
          <stop offset="1" stopColor="hsl(310, 95%, 62%)" />
        </linearGradient>
      </defs>
      <rect x="12" y="10" width="56" height="44" rx="16" fill="url(#mascot-body-gradient)" />
      <path d="M30 54 L36 66 L42 54" fill="url(#mascot-body-gradient)" />

      {/* Eyes */}
      <circle ref={leftEyeRef} cx="30" cy="32" r="3.5" className="fill-primary-foreground" />
      <circle ref={rightEyeRef} cx="50" cy="32" r="3.5" className="fill-primary-foreground" />

      {/* Smile */}
      <path d="M33 40 Q40 47 47 40" strokeWidth="2" strokeLinecap="round" fill="none" className="stroke-primary-foreground" />

      {/* Cheeks — glowing blush */}
      <circle cx="23" cy="38" r="4" fill="hsl(335, 100%, 60%)" opacity="0.35" />
      <circle cx="57" cy="38" r="4" fill="hsl(335, 100%, 60%)" opacity="0.35" />
    </svg>
  );
};

export default MascotBuddy;
