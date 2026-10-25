import type { Metadata } from 'next';
import Lab from '../../components/Lab';

export const metadata: Metadata = {
  title: 'Cheat sheet',
  description: 'Two-page ECE 121B formula sheet for Lectures 1–8.',
};

export default function CheatSheetPage() {
  return <Lab slug="cheat-sheet" />;
}
