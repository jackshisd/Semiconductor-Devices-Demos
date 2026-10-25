import type { Metadata } from 'next';
import Lab from '../../components/Lab';

export const metadata: Metadata = {
  title: 'Cheat sheets',
  description: 'Four-page and short ECE 121B formula sheets for Lectures 1–8.',
};

export default function CheatSheetPage() {
  return <Lab slug="cheat-sheet" />;
}
