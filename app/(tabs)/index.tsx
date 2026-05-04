import { StyleSheet, View } from 'react-native';

import { Typography } from '@/components/Typography';
import { lightColors, theme } from '@/constants/theme';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Typography variant="h1">홈</Typography>
      <Typography variant="body" style={styles.description}>
        YellowBall 홈 화면 placeholder입니다.
      </Typography>
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
