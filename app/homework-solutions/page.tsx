import type { Metadata } from 'next';
import Lab from '../../components/Lab';

export const metadata: Metadata = { title: 'Homework solutions' };

export default function HomeworkSolutionsPage() {
  return <Lab slug="homework-solutions" />;
}
