import type { SectionDef } from "./frame";
import IntroSection from "./sections/IntroSection";
import CourtyardSection from "./sections/CourtyardSection";
import GeometricProofSection from "./sections/GeometricProofSection";

/**
 * Ordered list of sections in this module's frame.
 * Each chunk of work adds (or extends) a self-contained section here.
 */
export const SECTIONS: SectionDef[] = [
  {
    id: "intro",
    title: "Introduction",
    component: IntroSection,
  },
  {
    id: "courtyard",
    title: "The Courtyard",
    component: CourtyardSection,
  },
  {
    id: "geometric",
    title: "Geometric Proof",
    component: GeometricProofSection,
  },
];
