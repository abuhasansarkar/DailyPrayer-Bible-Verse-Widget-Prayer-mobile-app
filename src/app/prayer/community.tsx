import { PrayerWall } from '@/components/community/PrayerWall';

// Stack route — same screen as the Wall tab, with a back button.
// Both routes render the shared component so they cannot drift apart.
export default function CommunityPrayerWallScreen() {
  return <PrayerWall showBackButton />;
}
