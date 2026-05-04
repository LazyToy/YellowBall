import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Typography } from '@/components/Typography';
import { lightColors, theme } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import {
  getSuspendedUsers,
  searchUsers,
  suspendUser,
  type ManagedUser,
  unsuspendUser,
} from '@/services/userManagementService';

const formatNoShowCount = (count?: number | null) =>
  typeof count === 'number' ? `${count}` : '-';

export default function AdminUsersScreen() {
  const { profile } = useAuth();
  const actorId = profile?.id;
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [suspendedUsers, setSuspendedUsers] = useState<ManagedUser[]>([]);
  const [message, setMessage] = useState<string>();
  const [isBusy, setIsBusy] = useState(false);

  const loadSuspendedUsers = useCallback(async () => {
    if (!actorId) {
      setSuspendedUsers([]);
      return;
    }

    setSuspendedUsers(await getSuspendedUsers(actorId));
  }, [actorId]);

  useEffect(() => {
    loadSuspendedUsers().catch((error) =>
      setMessage(
        error instanceof Error
          ? error.message
          : 'Unable to load suspended users.',
      ),
    );
  }, [loadSuspendedUsers]);

  const handleSearch = async () => {
    if (!actorId) {
      setMessage('Login is required.');
      return;
    }

    try {
      setIsBusy(true);
      setUsers(await searchUsers(actorId, query));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'User search failed.');
    } finally {
      setIsBusy(false);
    }
  };

  const runAction = async (task: () => Promise<void>, successMessage: string) => {
    if (!actorId) {
      setMessage('Login is required.');
      return;
    }

    try {
      setIsBusy(true);
      await task();
      await loadSuspendedUsers();
      if (query.trim()) {
        setUsers(await searchUsers(actorId, query));
      }
      setMessage(successMessage);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'User action failed.');
    } finally {
      setIsBusy(false);
    }
  };

  const confirmSuspend = (user: ManagedUser) => {
    Alert.alert(
      'Suspend User',
      `Suspend ${user.nickname}? Active bookings will be cancelled.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Suspend',
          style: 'destructive',
          onPress: () =>
            runAction(
              () =>
                suspendUser(actorId ?? '', user.id, 'Manual administrator suspension').then(
                  () => undefined,
                ),
              'User has been suspended.',
            ),
        },
      ],
    );
  };

  const renderUserCard = (user: ManagedUser, context: 'search' | 'suspended') => {
    const isSuspended = user.status === 'suspended';

    return (
      <View key={`${context}-${user.id}`} style={styles.card}>
        <View style={styles.rowBetween}>
          <View style={styles.userText}>
            <Typography variant="h2">{user.nickname}</Typography>
            <Typography variant="caption">
              {user.username} - {user.phone}
            </Typography>
          </View>
          <Badge variant={isSuspended ? 'destructive' : 'success'}>
            {isSuspended ? 'suspended' : 'active'}
          </Badge>
        </View>

        <View style={styles.metaRow}>
          <Typography variant="caption">
            Role: {user.role}
          </Typography>
          <Typography variant="caption">
            No-show: {formatNoShowCount(user.noShowCount)}
          </Typography>
        </View>

        {isSuspended ? (
          <Button
            accessibilityLabel={`${user.nickname} unsuspend`}
            disabled={isBusy}
            onPress={() =>
              runAction(
                () => unsuspendUser(actorId ?? '', user.id).then(() => undefined),
                'User has been unsuspended.',
              )
            }
            size="sm"
            variant="outline"
          >
            Unsuspend
          </Button>
        ) : (
          <Button
            accessibilityLabel={`${user.nickname} suspend`}
            disabled={isBusy || user.role === 'super_admin'}
            onPress={() => confirmSuspend(user)}
            size="sm"
            variant="outline"
          >
            Suspend
          </Button>
        )}
      </View>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Typography variant="h1">User Management</Typography>
        <Typography variant="caption" style={styles.muted}>
          Search users, suspend accounts, and restore suspended users.
        </Typography>
      </View>

      <View style={styles.section}>
        <Input
          label="User Search"
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          placeholder="Username, nickname, or phone"
          returnKeyType="search"
          value={query}
        />
        <Button disabled={isBusy} loading={isBusy} onPress={handleSearch} variant="outline">
          Search
        </Button>
        {users.map((user) => renderUserCard(user, 'search'))}
      </View>

      <View style={styles.section}>
        <View style={styles.rowBetween}>
          <Typography variant="h2">Suspended Users</Typography>
          <Badge variant="outline">{suspendedUsers.length}</Badge>
        </View>
        {suspendedUsers.length === 0 ? (
          <Typography variant="caption" style={styles.muted}>
            No suspended users.
          </Typography>
        ) : (
          suspendedUsers.map((user) => renderUserCard(user, 'suspended'))
        )}
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
  userText: {
    flex: 1,
    gap: theme.spacing[1],
  },
  metaRow: {
    flexDirection: 'row',
    gap: theme.spacing[4],
  },
  muted: {
    color: lightColors.mutedForeground.hex,
  },
  message: {
    color: lightColors.mutedForeground.hex,
  },
});
