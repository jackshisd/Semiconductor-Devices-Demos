import type { Metadata } from 'next';
import Lab from '../../components/Lab';
export const metadata: Metadata = {
  title: 'Midterm prep',
  description:
    'Two-page ECE 121B formula sheet and starter guide for Professor Emaminejad’s class.',
};
export default function Page() {
  return <Lab slug="midterm-prep" />;
}
