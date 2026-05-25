import { redirect } from 'next/navigation';

// Privacy policy is part of the combined Data Protection & Consent Agreement
export default function PrivacyPage() {
  redirect('/terms');
}
