import { useRef, useEffect } from "react";
import gsap from "gsap";

interface SplitTextAnimationProps {
  text: string;
  className?: string;
}

const SplitTextAnimation = ({ text, className = "" }: SplitTextAnimationProps) => {
  const containerRef = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current || !containerRef.current) return;
    hasAnimated.current = true;

    const chars = containerRef.current.querySelectorAll<HTMLSpanElement>(".split-char");
    gsap.set(chars, { opacity: 0, y: 20, rotateX: -40 });
    gsap.to(chars, {
      opacity: 1,
      y: 0,
      rotateX: 0,
      duration: 0.5,
      ease: "power3.out",
      stagger: 0.03,
      delay: 0.15,
    });
  }, [text]);

  return (
    <span ref={containerRef} className={className} style={{ perspective: 600 }}>
      {text.split("").map((char, i) => (
        <span
          key={`${char}-${i}`}
          className="split-char inline-block"
          style={{ willChange: "transform, opacity" }}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </span>
  );
};

export default SplitTextAnimation;
