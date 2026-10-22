import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Lab from '../../../components/Lab';
import lectures from '../../../lib/lectures.json';

export const dynamicParams = false;
export function generateStaticParams() {
  return lectures.map(({ id }) => ({ lecture: id }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lecture: string }>;
}): Promise<Metadata> {
  const { lecture: id } = await params;
  const lecture = lectures.find((item) => item.id === id);
  return lecture
    ? {
        title: lecture.title,
        description: `Read ${lecture.pages} slides from ${lecture.title} in the semiconductor physics course.`,
      }
    : {};
}
export default async function LecturePage({ params }: { params: Promise<{ lecture: string }> }) {
  const { lecture: id } = await params;
  if (!lectures.some((item) => item.id === id)) notFound();
  return <Lab slug="lectures" lectureId={id} />;
}
