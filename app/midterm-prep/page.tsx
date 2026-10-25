import type { Metadata } from 'next';
import Lab from '../../components/Lab';
export const metadata: Metadata = {
  title: 'Midterm prep',
  description: 'Interactive ECE 121B practice problems for Lectures 1–8.',
};
export default function Page() {
  return <Lab slug="midterm-prep" />;
}
