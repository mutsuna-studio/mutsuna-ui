export const loadingVariants = ["dots", "bars", "bouncing-dots", "typing", "arc", "classic", "clock-ring", "concentric-ring", "diamond", "dual-arc", "infinity", "morphing-infinity", "orbit-ring", "pulse", "pulse-dot", "quarter-ring", "ring", "satellite-ring", "spokes", "swirling", "terminal", "triple-dot-spinner", "twin-orbit", "wave"] as const;

export type LoadingVariant = (typeof loadingVariants)[number];
