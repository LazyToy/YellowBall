import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Typography } from '@/components/Typography';
import { lightColors, theme } from '@/constants/theme';

export default function ShopScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Typography variant="h1">Shop</Typography>
      <Typography variant="body" style={styles.description}>
        Browse available strings before booking stringing service.
      </Typography>
      <Button onPress={() => router.push('/string-catalog')}>String Catalog</Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: lightColors.background.hex,
    flex: 1,
    gap: theme.spacing[3],
    padding: theme.spacing[6],
    paddingTop: theme.spacing[12],
  },
  description: {
    color: lightColors.mutedForeground.hex,
  },
});
