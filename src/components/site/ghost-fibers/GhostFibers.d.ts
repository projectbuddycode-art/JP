declare module "@/components/site/ghost-fibers/GhostFibers" {
  import type { CSSProperties } from "react";

  export type GhostFibersProps = {
    glowColor?: string;
    lineColor?: string;
    secondaryColor?: string;
    gradient?: "depth" | "along" | "across";
    layers?: number;
    waves?: number;
    twist?: number;
    volume?: number;
    spread?: number;
    scale?: number;
    rotation?: number;
    perspective?: number;
    threads?: number;
    density?: number;
    thickness?: number;
    fiberStyle?: "dots" | "dashes" | "lines";
    tips?: number;
    foldGlow?: number;
    speed?: number;
    flow?: number;
    rollSpeed?: number;
    depthOfField?: number;
    focusDepth?: number;
    particles?: number;
    sparkle?: number;
    glow?: number;
    brightness?: number;
    vignette?: number;
    grain?: number;
    mouseInteraction?: boolean;
    hoverEffect?: "focus" | "part" | "none";
    mouseStrength?: number;
    pulseOnClick?: boolean;
    intro?: boolean;
    lightMode?: boolean;
    paused?: boolean;
    dpr?: number;
    className?: string;
    style?: CSSProperties;
  };

  export default function GhostFibers(props: GhostFibersProps): JSX.Element;
}
