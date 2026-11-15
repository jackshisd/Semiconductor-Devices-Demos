import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Lab from '../../components/Lab';
import { experiments, legacyExperimentAliases } from '../../lib/experiments';

export const dynamicParams = false;
export function generateStaticParams() {
  return [
    ...experiments.map(({ slug }) => ({ slug })),
    ...Object.keys(legacyExperimentAliases).map((slug) => ({ slug })),
  ];
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const canonicalSlug =
    legacyExperimentAliases[slug as keyof typeof legacyExperimentAliases] ?? slug;
  const page = experiments.find((page) => page.slug === canonicalSlug);
  return page ? { title: page.title, description: page.subtitle } : {};
}
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const canonicalSlug =
    legacyExperimentAliases[slug as keyof typeof legacyExperimentAliases] ?? slug;
  if (!experiments.some((page) => page.slug === canonicalSlug)) notFound();
  return <Lab slug={canonicalSlug} />;
}
