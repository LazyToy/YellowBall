import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, View } from 'react-native';

import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Typography } from '@/components/Typography';
import { lightColors, theme } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import {
  allPermissionKeys,
  appointAdmin,
  dismissAdmin,
  getAdmins,
  searchUsers,
  updatePermissions,
} from '@/services/adminService';
import type { AdminPermission, Profile } from '@/types/database';

type AdminRow = Profile & { permissions: AdminPermission | null };

const permissionLabels: Record<keyof Omit<AdminPermission, 'admin_id'>, string> = {
  can_manage_strings: '스트링',
  can_manage_demo_rackets: '시타 라켓',
  can_manage_bookings: '예약',
  can_ban_users: '제재',
  can_manage_products: '상품',
  can_manage_orders: '주문',
  can_post_notice: '공지',
  can_toggle_app_menu: '앱 메뉴',
  can_manage_admins: '관리자',
};

export default function ManageAdminsScreen() {
  const { profile } = useAuth();
  const actorId = profile?.id;
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<Profile[]>([]);
  const [message, setMessage] = useState<string>();
  const [isBusy, setIsBusy] = useState(false);

  const loadAdmins = useCallback(async () => {
    setAdmins(await getAdmins());
  }, []);

  useEffect(() => {
    loadAdmins().catch(() => setMessage('관리자 목록을 불러오지 못했습니다.'));
  }, [loadAdmins]);

  const handleSearch = async () => {
    try {
      setUsers(await searchUsers(query));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '사용자 검색에 실패했습니다.');
    }
  };

  const runAction = async (task: () => Promise<void>, successMessage: string) => {
    if (!actorId) {
      setMessage('로그인이 필요합니다.');
      return;
    }

    try {
      setIsBusy(true);
      await task();
      await loadAdmins();
      setMessage(successMessage);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '작업에 실패했습니다.');
    } finally {
      setIsBusy(false);
    }
  };

  const confirmDismissAdmin = (admin: AdminRow) => {
    Alert.alert(
      '관리자 해임',
      `${admin.nickname} 관리자를 해임할까요? 권한 정보가 삭제됩니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '해임',
          style: 'destructive',
          onPress: () =>
            runAction(
              () => dismissAdmin(actorId ?? '', admin.id),
              '관리자를 해임했습니다.',
            ),
        },
      ],
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Typography variant="h1">관리자 권한</Typography>
        <Typography variant="caption">
          슈퍼 관리자만 임명, 해임, 권한 변경을 수행할 수 있습니다.
        </Typography>
      </View>

      <View style={styles.section}>
        <Input
          label="사용자 검색"
          onChangeText={setQuery}
          placeholder="아이디, 닉네임, 전화번호"
          value={query}
        />
        <Button disabled={isBusy} onPress={handleSearch} variant="outline">
          검색
        </Button>
        {users.map((user) => (
          <View key={user.id} style={styles.card}>
            <View style={styles.rowBetween}>
              <View>
                <Typography variant="h2">{user.nickname}</Typography>
                <Typography variant="caption">
                  {user.username} · {user.phone}
                </Typography>
              </View>
              <Badge variant={user.role === 'admin' ? 'success' : 'outline'}>
                {user.role}
              </Badge>
            </View>
            <Button
              disabled={isBusy || user.role === 'admin'}
              onPress={() =>
                runAction(
                  () => appointAdmin(actorId ?? '', user.id).then(() => undefined),
                  '관리자로 임명했습니다.',
                )
              }
              size="sm"
            >
              임명
            </Button>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        {admins.map((admin) => {
          const permissions = admin.permissions;
          const isSelf = admin.id === actorId;
          const isSuperAdmin = admin.role === 'super_admin';

          return (
            <View key={admin.id} style={styles.card}>
              <View style={styles.rowBetween}>
                <View>
                  <Typography variant="h2">{admin.nickname}</Typography>
                  <Typography variant="caption">
                    {admin.username} · {admin.phone}
                  </Typography>
                </View>
                <Badge variant={isSuperAdmin ? 'default' : 'secondary'}>
                  {isSuperAdmin ? 'super_admin' : 'admin'}
                </Badge>
              </View>

              {isSuperAdmin ? (
                <Typography variant="caption">
                  슈퍼 관리자는 모든 권한을 가집니다.
                </Typography>
              ) : (
                <View style={styles.permissionGrid}>
                  {allPermissionKeys.map((key) => (
                    <View key={key} style={styles.permissionRow}>
                      <Typography variant="body">{permissionLabels[key]}</Typography>
                      <Switch
                        accessibilityLabel={`${admin.nickname} ${permissionLabels[key]} 권한`}
                        disabled={isBusy || isSelf}
                        onValueChange={(nextValue) =>
                          runAction(
                            () =>
                              updatePermissions(actorId ?? '', admin.id, {
                                [key]: nextValue,
                              }).then(() => undefined),
                            '권한을 변경했습니다.',
                          )
                        }
                        value={Boolean(permissions?.[key])}
                      />
                    </View>
                  ))}
                </View>
              )}

              {!isSuperAdmin ? (
                <Button
                  accessibilityLabel={`${admin.nickname} 관리자 해임 확인`}
                  disabled={isBusy || isSelf}
                  onPress={() => confirmDismissAdmin(admin)}
                  size="sm"
                  variant="outline"
                >
                  해임
                </Button>
              ) : null}
            </View>
          );
        })}
      </View>

      {message ? (
        <Typography accessibilityRole="alert" variant="caption" style={styles.message}>
          {message}
        </Typography>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: lightColors.background.hex,
    gap: theme.spacing[5],
    padding: theme.spacing[6],
    paddingTop: theme.spacing[12],
  },
  header: {
    gap: theme.spacing[2],
  },
  section: {
    gap: theme.spacing[3],
  },
  card: {
    backgroundColor: lightColors.card.hex,
    borderColor: lightColors.border.hex,
    borderRadius: theme.borderRadius.lg,
    borderWidth: theme.borderWidth.hairline,
    gap: theme.spacing[3],
    padding: theme.spacing[4],
  },
  rowBetween: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing[3],
    justifyContent: 'space-between',
  },
  permissionGrid: {
    gap: theme.spacing[2],
  },
  permissionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: theme.controlHeights.md,
  },
  message: {
    color: lightColors.mutedForeground.hex,
  },
});
