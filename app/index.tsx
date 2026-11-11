import { Redirect } from 'expo-router';

import { useAuth } from '@/src/features/auth/AuthContext';
import { LoadingView } from '@/src/ui/LoadingView';

export default function Index() {
  const { ready, mode } = useAuth();

  if (!ready) {
    return <LoadingView />;
  }

  if (!mode) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href="/(app)/(tabs)/apartments" />;
}
