// Plain pass-through wrapper. Originally a scroll-triggered fade/slide; the
// site now mirrors concordiabible.org's static, no-animation aesthetic, so
// this just renders its children. Kept as a component so call sites compile.
export default function Reveal({ children, className = "", as: As = "div" }) {
  return <As className={className}>{children}</As>;
}

export const revealItem = {};
