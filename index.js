
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(() => {
    router.replace('/login');
    }, 100); 

    return () => clearTimeout(timeout);
  }, []);

  return null;
}
