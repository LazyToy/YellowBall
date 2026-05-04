import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Typography } from '@/components/Typography';
import { lightColors, theme } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { updateProfile } from '@/services/profileService';

export default function MeScreen() {
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const profileId = profile?.id;
  const [profileOverride, setProfileOverride] = useState<typeof profile>(null);
  const currentProfile = profileOverride ?? profile;
  const [isEditing, setIsEditing] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [nickname, setNickname] = useState(currentProfile?.nickname ?? '');
  const [phone, setPhone] = useState(currentProfile?.phone ?? '');
  const [errorMessage, setErrorMessage] = useState<string>();
  const [successMessage, setSuccessMessage] = useState<string>();

  useEffect(() => {
    setProfileOverride(null);
  }, [profileId]);

  const handleSaveProfile = async () => {
    if (!currentProfile) {
      setErrorMessage('프로필을 불러온 뒤 다시 시도해 주세요.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(undefined);
    setSuccessMessage(undefined);

    try {
      const updatedProfile = await updateProfile(currentProfile.id, {
        nickname,
        phone,
      });
      setProfileOverride(updatedProfile);
      setNickname(updatedProfile.nickname);
      setPhone(updatedProfile.phone);
      setIsEditing(false);
      setSuccessMessage('프로필이 저장되었습니다.');
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : '프로필을 저장하지 못했습니다.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    setErrorMessage(undefined);

    try {
      await signOut();
      router.replace('/(auth)/login');
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : '로그아웃에 실패했습니다. 잠시 후 다시 시도해 주세요.',
      );
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Typography variant="caption" style={styles.eyebrow}>
          My YellowBall
        </Typography>
        <Typography variant="h1">마이</Typography>
        <Typography variant="body" style={styles.description}>
          내 예약과 계정 정보를 확인할 수 있습니다.
        </Typography>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Typography variant="h2" style={styles.avatarText}>
            {(currentProfile?.nickname ?? 'Y').slice(0, 1)}
          </Typography>
        </View>
        <View style={styles.profileTextWrap}>
          <Typography variant="h2">{currentProfile?.nickname ?? '회원'}</Typography>
          <Typography variant="caption" style={styles.description}>
            {currentProfile?.phone ?? '휴대폰 번호를 불러오는 중입니다.'}
          </Typography>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Typography variant="h2">프로필 정보</Typography>
          <Button
            accessibilityLabel={isEditing ? '프로필 수정 취소' : '프로필 수정'}
            onPress={() => {
              setNickname(currentProfile?.nickname ?? '');
              setPhone(currentProfile?.phone ?? '');
              setIsEditing((editing) => !editing);
            }}
            size="sm"
            variant="outline"
          >
            {isEditing ? '취소' : '수정'}
          </Button>
        </View>
        <Input
          editable={false}
          label="아이디"
          value={currentProfile?.username ?? ''}
        />
        <Input
          editable={isEditing}
          label="닉네임"
          onChangeText={setNickname}
          value={nickname}
        />
        <Input
          editable={isEditing}
          keyboardType="phone-pad"
          label="전화번호"
          onChangeText={setPhone}
          value={phone}
        />
        {isEditing ? (
          <Button
            accessibilityLabel="프로필 저장"
            loading={isSaving}
            onPress={handleSaveProfile}
          >
            저장
          </Button>
        ) : null}
      </View>

      <View style={styles.menuList}>
        <MenuItem label="주소 관리" onPress={() => router.push('/addresses')} />
        <MenuItem label="내 라켓" onPress={() => router.push('/rackets')} />
        <MenuItem label="스트링 세팅" onPress={() => router.push('/string-setups')} />
        <MenuItem
          label="알림 설정"
          onPress={() => router.push('/notification-settings')}
        />
        <MenuItem label="알림함" onPress={() => router.push('/notifications')} />
        <MenuItem
          label="계정 탈퇴"
          onPress={() => router.push('/account-deletion')}
        />
      </View>

      {errorMessage ? (
        <Typography
          accessibilityRole="alert"
          variant="caption"
          style={styles.errorText}
        >
          {errorMessage}
        </Typography>
      ) : null}

      {successMessage ? (
        <Typography
          accessibilityRole="alert"
          variant="caption"
          style={styles.successText}
        >
          {successMessage}
        </Typography>
      ) : null}

      <Button
        accessibilityLabel="로그아웃"
        loading={isSigningOut}
        onPress={handleSignOut}
        variant="outline"
      >
        로그아웃
      </Button>
    </View>
  );
}

function MenuItem({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
    >
      <Typography variant="body">{label}</Typography>
      <Typography variant="body" style={styles.menuChevron}>
        {'>'}
      </Typography>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: lightColors.background.hex,
    flex: 1,
    gap: theme.spacing[5],
    padding: theme.spacing[6],
    paddingTop: theme.spacing[12],
  },
  header: {
    gap: theme.spacing[2],
  },
  eyebrow: {
    color: lightColors.primary.hex,
    fontWeight: theme.typography.fontWeight.semibold,
    textTransform: 'uppercase',
  },
  description: {
    color: lightColors.mutedForeground.hex,
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: lightColors.card.hex,
    borderColor: lightColors.border.hex,
    borderRadius: theme.borderRadius.xl,
    borderWidth: theme.borderWidth.hairline,
    flexDirection: 'row',
    gap: theme.spacing[4],
    padding: theme.spacing[5],
    ...theme.shadow.card,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: lightColors.primary.hex,
    borderRadius: 999,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  avatarText: {
    color: lightColors.primaryForeground.hex,
  },
  profileTextWrap: {
    flex: 1,
    gap: theme.spacing[1],
  },
  errorText: {
    color: lightColors.destructive.hex,
  },
  successText: {
    color: lightColors.primary.hex,
  },
  section: {
    gap: theme.spacing[3],
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  menuList: {
    borderColor: lightColors.border.hex,
    borderRadius: theme.borderRadius.lg,
    borderWidth: theme.borderWidth.hairline,
    overflow: 'hidden',
  },
  menuItem: {
    alignItems: 'center',
    backgroundColor: lightColors.card.hex,
    borderBottomColor: lightColors.border.hex,
    borderBottomWidth: theme.borderWidth.hairline,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: theme.spacing[4],
  },
  menuChevron: {
    color: lightColors.mutedForeground.hex,
  },
  pressed: {
    opacity: theme.opacity.pressed,
  },
});
