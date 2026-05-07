import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { ConfirmDialog, FeedbackDialog } from '@/components/FeedbackDialog';
import { Input } from '@/components/Input';
import { BackButton } from '@/components/MobileUI';
import { RefreshableScrollView } from '@/components/PageRefresh';
import { Typography } from '@/components/Typography';
import { lightColors, theme } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useResetOnBlur } from '@/hooks/useResetOnBlur';
import {
  addAddress,
  deleteAddress,
  getAddresses,
  setDefaultAddress,
  updateAddress,
} from '@/services/addressService';
import type { Address } from '@/types/database';

export default function AddressesScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const profileId = profile?.id;
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [recipientName, setRecipientName] = useState('');
  const [phone, setPhone] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [message, setMessage] = useState<string>();
  const [successDialog, setSuccessDialog] = useState<{
    title: string;
    message?: string;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Address | null>(null);

  const loadAddresses = useCallback(async () => {
    if (!profileId) {
      return;
    }

    setAddresses(await getAddresses(profileId));
  }, [profileId]);

  useEffect(() => {
    loadAddresses().catch(() => setMessage('주소를 불러오지 못했습니다.'));
  }, [loadAddresses]);

  const clearForm = useCallback(() => {
    setRecipientName('');
    setPhone('');
    setPostalCode('');
    setAddressLine1('');
    setAddressLine2('');
    setEditingAddressId(null);
  }, []);

  const resetScreen = useCallback(() => {
    clearForm();
    setMessage(undefined);
    setSuccessDialog(null);
    setDeleteTarget(null);
  }, [clearForm]);

  useResetOnBlur(resetScreen);

  const startEditing = (address: Address) => {
    setRecipientName(address.recipient_name);
    setPhone(address.phone);
    setPostalCode(address.postal_code ?? '');
    setAddressLine1(address.address_line1);
    setAddressLine2(address.address_line2 ?? '');
    setEditingAddressId(address.id);
  };

  const handleSaveAddress = async () => {
    if (!profile) {
      setMessage('로그인이 필요합니다.');
      return;
    }

    try {
      const payload = {
        recipient_name: recipientName,
        phone,
        postal_code: postalCode || null,
        address_line1: addressLine1,
        address_line2: addressLine2 || null,
      };

      const wasEditing = editingAddressId !== null;

      if (editingAddressId) {
        await updateAddress(editingAddressId, payload);
      } else {
        await addAddress({
          user_id: profile.id,
          ...payload,
        });
      }

      clearForm();
      await loadAddresses();
      setSuccessDialog({
        title: wasEditing ? '주소가 수정되었습니다' : '주소가 등록되었습니다',
        message: '확인을 누르면 주소 목록을 확인할 수 있습니다.',
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '주소 저장 실패');
    }
  };

  const handleSetDefaultAddress = async (address: Address) => {
    try {
      await setDefaultAddress(address.id);
      await loadAddresses();
      setSuccessDialog({
        title: '기본 주소가 변경되었습니다',
        message: '확인을 누르면 주소 목록을 확인할 수 있습니다.',
      });
    } catch {
      setMessage('기본 주소 설정 실패');
    }
  };

  const handleDeleteAddress = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      await deleteAddress(deleteTarget.id);
      setDeleteTarget(null);
      await loadAddresses();
      setSuccessDialog({
        title: '주소가 삭제되었습니다',
        message: '확인을 누르면 주소 목록을 확인할 수 있습니다.',
      });
    } catch {
      setMessage('주소 삭제 실패');
    }
  };

  return (
    <RefreshableScrollView contentContainerStyle={styles.container}>
      <FeedbackDialog
        visible={successDialog !== null}
        title={successDialog?.title ?? ''}
        message={successDialog?.message}
        onConfirm={() => setSuccessDialog(null)}
      />
      <ConfirmDialog
        visible={deleteTarget !== null}
        title="주소를 삭제할까요?"
        message={deleteTarget?.address_line1}
        confirmLabel="삭제"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteAddress}
      />
      <View style={styles.titleRow}>
        <BackButton onPress={() => router.back()} />
        <Typography variant="h1">주소 관리</Typography>
      </View>
      <View style={styles.section}>
        <Input label="받는 분" onChangeText={setRecipientName} value={recipientName} />
        <Input keyboardType="phone-pad" label="전화번호" onChangeText={setPhone} value={phone} />
        <Input label="우편번호" onChangeText={setPostalCode} value={postalCode} />
        <Input label="주소" onChangeText={setAddressLine1} value={addressLine1} />
        <Input label="상세 주소" onChangeText={setAddressLine2} value={addressLine2} />
        <Button
          accessibilityLabel={editingAddressId ? '주소 수정 저장' : '주소 추가'}
          onPress={handleSaveAddress}
        >
          {editingAddressId ? '수정 저장' : '주소 추가'}
        </Button>
        {editingAddressId ? (
          <Button accessibilityLabel="주소 수정 취소" onPress={clearForm} variant="outline">
            취소
          </Button>
        ) : null}
      </View>

      <View style={styles.section}>
        {addresses.map((address) => (
          <View key={address.id} style={styles.card}>
            <Typography variant="h2">
              {address.recipient_name}
              {address.is_default ? ' · 기본' : ''}
            </Typography>
            <Typography variant="body">{address.phone}</Typography>
            <Typography variant="caption" style={styles.muted}>
              {[address.postal_code, address.address_line1, address.address_line2]
                .filter(Boolean)
                .join(' ')}
            </Typography>
            <View style={styles.actions}>
              <Button
                accessibilityLabel={`${address.recipient_name} 기본 주소 설정`}
                disabled={address.is_default}
                onPress={() => handleSetDefaultAddress(address)}
                size="sm"
                variant="outline"
              >
                기본
              </Button>
              <Button
                accessibilityLabel={`${address.recipient_name} 주소 수정`}
                onPress={() => startEditing(address)}
                size="sm"
                variant="outline"
              >
                수정
              </Button>
              <Button
                accessibilityLabel={`${address.recipient_name} 주소 삭제`}
                onPress={() => setDeleteTarget(address)}
                size="sm"
                variant="outline"
              >
                삭제
              </Button>
            </View>
          </View>
        ))}
      </View>

      {message ? (
        <Typography accessibilityRole="alert" variant="caption" style={styles.muted}>
          {message}
        </Typography>
      ) : null}
    </RefreshableScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: lightColors.background.hex,
    gap: theme.spacing[5],
    padding: theme.spacing[6],
    paddingTop: theme.spacing[12],
  },
  section: {
    gap: theme.spacing[3],
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing[2],
  },
  card: {
    backgroundColor: lightColors.card.hex,
    borderColor: lightColors.border.hex,
    borderRadius: theme.borderRadius.lg,
    borderWidth: theme.borderWidth.hairline,
    gap: theme.spacing[2],
    padding: theme.spacing[4],
  },
  muted: {
    color: lightColors.mutedForeground.hex,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing[2],
  },
});
