/* eslint-disable @typescript-eslint/no-explicit-any */
declare module "motion-dom" {
  type TargetAndTransition = Record<string, string | number | boolean>;
  type VariantLabels = string | string[];

  interface Transition {
    delay?: number;
    duration?: number;
    ease?: string | number[];
    type?: string;
    stiffness?: number;
    damping?: number;
    mass?: number;
    bounce?: number;
    restSpeed?: number;
    restDelta?: number;
    when?: "beforeChildren" | "afterChildren";
    staggerChildren?: number;
    staggerDirection?: number;
    delayChildren?: number;
  }

  interface ViewportOptions {
    once?: boolean;
    margin?: string;
    amount?: number | "all" | "some";
    root?: React.RefObject<Element>;
  }

  type TargetValue = string | number | boolean | Record<string, unknown>;
  type Target = Record<string, TargetValue>;
  type Variants = Record<string, Target & { transition?: Transition }>;

  interface MotionNodeOptions {
    initial?: boolean | Target | VariantLabels;
    animate?: Target | VariantLabels;
    exit?: Target | VariantLabels;
    variants?: Variants;
    transition?: Transition;
    whileHover?: Target | VariantLabels;
    whileTap?: Target | VariantLabels;
    whileFocus?: Target | VariantLabels;
    whileDrag?: Target | VariantLabels;
    whileInView?: Target | VariantLabels;
    viewport?: ViewportOptions;
    layout?: boolean | "position" | "size" | "preserve-aspect";
    layoutId?: string;
    onAnimationStart?: () => void;
    onAnimationComplete?: () => void;
    onUpdate?: (values: Record<string, string | number>) => void;
  }

  class MotionValue<V = number> {
    get(): V;
    set(v: V): void;
    onChange(callback: (v: V) => void): () => void;
  }

  interface TransformProperties {
    x?: string | number;
    y?: string | number;
    z?: string | number;
    rotate?: string | number;
    rotateX?: string | number;
    rotateY?: string | number;
    rotateZ?: string | number;
    scale?: number;
    scaleX?: number;
    scaleY?: number;
    scaleZ?: number;
    skew?: string | number;
    skewX?: string | number;
    skewY?: string | number;
    originX?: string | number;
    originY?: string | number;
    originZ?: string | number;
    perspective?: string | number;
    transformPerspective?: string | number;
  }

  interface SVGPathProperties {
    pathLength?: number;
    pathOffset?: number;
    pathSpacing?: number;
  }

  interface Batcher {
    schedule: (...args: unknown[]) => void;
    cancel: (...args: unknown[]) => void;
  }

  type JSAnimation = unknown;
  type ValueTransition = unknown;
  type AnyResolvedKeyframe = unknown;
  type KeyframeResolver = unknown;
  type AnimationDefinition = unknown;

  export {
    MotionNodeOptions,
    MotionValue,
    TransformProperties,
    SVGPathProperties,
    Transition,
    Batcher,
    JSAnimation,
    ValueTransition,
    TargetAndTransition,
    AnyResolvedKeyframe,
    KeyframeResolver,
    AnimationDefinition,
    Variants,
    VariantLabels,
    Target,
    ViewportOptions,
  };
}
