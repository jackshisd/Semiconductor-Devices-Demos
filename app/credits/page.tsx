import type { Metadata } from 'next';
import Lab from '../../components/Lab';

export const metadata: Metadata = { title: 'Credits' };

export default function CreditsPage() {
  return <Lab slug="credits" />;
}
