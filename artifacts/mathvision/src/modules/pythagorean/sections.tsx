import type { SectionDef } from "./frame";
import IntroSection from "./sections/IntroSection";
import CourtyardSection from "./sections/CourtyardSection";
import GeometricProofSection from "./sections/GeometricProofSection";
import AlgebraicSection from "./sections/AlgebraicSection";
import DistanceSection from "./sections/DistanceSection";
import PrismSection from "./sections/PrismSection";
import D3dSection from "./sections/D3dSection";
import CircleSection from "./sections/CircleSection";
import SphereSection from "./sections/SphereSection";
import ClosingSection from "./sections/ClosingSection";

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
  {
    id: "algebraic",
    title: "Algebraic Proof",
    component: AlgebraicSection,
  },
  {
    id: "distance-2d",
    title: "2D Distance",
    component: DistanceSection,
  },
  {
    id: "prism-3d",
    title: "Prism Diagonal",
    component: PrismSection,
  },
  {
    id: "distance-3d",
    title: "3D Distance",
    component: D3dSection,
  },
  {
    id: "circle",
    title: "Circle Formula",
    component: CircleSection,
  },
  {
    id: "sphere",
    title: "Sphere Formula",
    component: SphereSection,
  },
  {
    id: "closing",
    title: "Full Circle",
    component: ClosingSection,
  },
];
