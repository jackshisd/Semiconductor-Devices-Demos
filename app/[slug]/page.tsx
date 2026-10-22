import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Lab from '../../components/Lab';
import { experiments } from '../../lib/experiments';

export const dynamicParams = false;
export function generateStaticParams() {
  return experiments.map(({ slug }) => ({ slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = experiments.find((page) => page.slug === slug);
  return page ? { title: page.title, description: page.subtitle } : {};
}
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!experiments.some((page) => page.slug === slug)) notFound();
  return <Lab slug={slug} />;
}
