'use client';
import { Component, Suspense, lazy, type ReactNode, type ComponentType } from 'react';
import CourseNotes from './CourseNotes';
import { InlineControlsContext } from './DemoPresentation';
import type { ExperimentSlug } from '../lib/experiments';
const loading = (
  <div className="experiment-loading" role="status">
    Preparing experiment…
  </div>
);
const demos: Record<ExperimentSlug, ComponentType> = {
  'phonon-scattering': lazy(() =>
    import('./ScatteringDemos').then((m) => ({ default: m.PhononScattering })),
  ),
  'impurity-scattering': lazy(() =>
    import('./ScatteringDemos').then((m) => ({ default: m.ImpurityScattering })),
  ),
  'electron-hole-motion': lazy(() =>
    import('./ElectronHoleMotion').then((m) => ({ default: m.ElectronHoleMotion })),
  ),
  'band-formation': lazy(() =>
    import('./LectureTwoDemos').then((m) => ({ default: m.BandFormation })),
  ),
  'doping-carriers': lazy(() =>
    import('./LectureTwoDemos').then((m) => ({ default: m.DopingCarriers })),
  ),
  'thermal-equilibrium': lazy(() =>
    import('./LectureTwoDemos').then((m) => ({ default: m.ThermalEquilibrium })),
  ),
  'boltzmann-approximation': lazy(() =>
    import('./LectureTwoDemos').then((m) => ({ default: m.BoltzmannApproximation })),
  ),
  'intrinsic-carriers': lazy(() =>
    import('./IntrinsicCarriers').then((m) => ({ default: m.IntrinsicCarriers })),
  ),
  doping: lazy(() => import('./Demos').then((m) => ({ default: m.Doping }))),
  'pn-depletion': lazy(() => import('./Demos').then((m) => ({ default: m.PNDepletion }))),
  'built-in-potential': lazy(() => import('./Demos').then((m) => ({ default: m.BuiltIn }))),
  'drift-diffusion': lazy(() =>
    import('./TransportDemos').then((m) => ({ default: m.DriftDiffusion })),
  ),
  'minority-diffusion': lazy(() =>
    import('./TransportDemos').then((m) => ({ default: m.MinorityDiffusion })),
  ),
  continuity: lazy(() =>
    import('./TransportDemos').then((m) => ({ default: m.ContinuityEquation })),
  ),
  'ideal-diode': lazy(() => import('./CourseDemos').then((m) => ({ default: m.CourseIdealDiode }))),
  'avalanche-breakdown': lazy(() =>
    import('./BreakdownDemos').then((m) => ({ default: m.AvalancheBreakdown })),
  ),
  'zener-breakdown': lazy(() =>
    import('./BreakdownDemos').then((m) => ({ default: m.ZenerBreakdown })),
  ),
  'quasi-fermi': lazy(() => import('./CourseDemos').then((m) => ({ default: m.CourseQuasiFermi }))),
  'hole-distribution': lazy(() =>
    import('./HoleDistributionDemo').then((m) => ({ default: m.HoleDistributionDemo })),
  ),
  'degenerate-doping': lazy(() =>
    import('./CourseDemos').then((m) => ({ default: m.CourseDegenerate })),
  ),
  'degenerate-junctions': lazy(() =>
    import('./Demos').then((m) => ({ default: m.DegenerateJunctions })),
  ),
  schottky: lazy(() => import('./Demos').then((m) => ({ default: m.Schottky }))),
  'schottky-bias': lazy(() => import('./Demos').then((m) => ({ default: m.SchottkyBias }))),
  capacitance: lazy(() => import('./Demos').then((m) => ({ default: m.Capacitance }))),
};

class ExperimentBoundary extends Component<
  { children: ReactNode },
  { failed: boolean; revision: number }
> {
  state = { failed: false, revision: 0 };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <div className="error-box" role="alert">
          <h2>This experiment could not render</h2>
          <p>Restore the default settings to continue.</p>
          <button
            className="reset-button"
            onClick={() =>
              this.setState((state) => ({ failed: false, revision: state.revision + 1 }))
            }
          >
            Restart experiment
          </button>
        </div>
      );
    return <div key={this.state.revision}>{this.props.children}</div>;
  }
}

export default function ExperimentView({
  slug,
  embedded = false,
}: {
  slug: ExperimentSlug;
  embedded?: boolean;
}) {
  const Demo = demos[slug];
  return (
    <InlineControlsContext.Provider value={embedded}>
      <ExperimentBoundary key={slug}>
        <Suspense fallback={loading}>
          <div className="experiment-content" data-experiment={slug}>
            <Demo />
            <CourseNotes slug={slug} />
          </div>
        </Suspense>
      </ExperimentBoundary>
    </InlineControlsContext.Provider>
  );
}
