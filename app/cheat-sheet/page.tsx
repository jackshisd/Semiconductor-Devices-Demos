import type { Metadata } from 'next';
import Lab from '../../components/Lab';

export const metadata: Metadata = {
  title: 'Cheat sheets',
  description:
    'Eight-page, four-page, and short ECE 121B formula sheets for Lectures 1–12 and Homeworks 1–3.',
};

export default function CheatSheetPage() {
  return <Lab slug="cheat-sheet" />;
}
