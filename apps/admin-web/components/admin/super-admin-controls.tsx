'use client';

import { useMemo, useState, useTransition } from 'react';
import {
  Check,
  Crown,
  Loader2,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  UserMinus,
  UserPlus,
} from 'lucide-react';
import {
  appointAdminFromWeb,
  dismissAdminFromWeb,
  updateAdminPermissionsFromWeb,
  updateMenuSettingFromWeb,
} from '@/lib/admin-actions';
import {
  getProfileDisplayName,
  getRoleLabel,
  menuGroups,
  permissionDefinitions,
  type AdminPermissionKey,
  type AdminPermissionRow,
  type AdminWithPermissions,
  type MenuId,
  type MenuSettings,
  type ProfileRow,
} from '@/lib/super-admin-data';
import { ActionConfirmDialog, ActionFeedbackDialog } from './action-dialogs';

type ActionState = {
  pending: boolean;
  message: string | null;
};

const idleActionState: ActionState = {
  pending: false,
  message: null,
};

function copyPermissions(permissions: AdminPermissionRow) {
  return permissionDefinitions.reduce<Partial<Record<AdminPermissionKey, boolean>>>(
    (next, definition) => {
      next[definition.key] = permissions[definition.key];
      return next;
    },
    {},
  );
}

export function AdminManagementControls({
  admins,
  userCandidates,
}: {
  admins: AdminWithPermissions[];
  userCandidates: ProfileRow[];
}) {
  const [selectedId, setSelectedId] = useState(admins[0]?.id ?? '');
  const selectedAdmin = admins.find((admin) => admin.id === selectedId) ?? admins[0] ?? null;
  const [draft, setDraft] = useState(() =>
    selectedAdmin ? copyPermissions(selectedAdmin.permissions) : {},
  );
  const [candidateId, setCandidateId] = useState(userCandidates[0]?.id ?? '');
  const [actionState, setActionState] = useState<ActionState>(idleActionState);
  const [confirmDismissOpen, setConfirmDismissOpen] = useState(false);
  const [feedback, setFeedback] = useState<{
    title: string;
    description?: string;
    tone?: 'success' | 'danger';
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedIsSuperAdmin = selectedAdmin?.role === 'super_admin';

  const selectAdmin = (admin: AdminWithPermissions) => {
    setSelectedId(admin.id);
    setDraft(copyPermissions(admin.permissions));
    setActionState(idleActionState);
  };

  const runAction = (callback: () => Promise<{ success: boolean; error?: string }>) => {
    setActionState({ pending: true, message: null });
    startTransition(async () => {
      const result = await callback();
      if (result.success) {
        setActionState({ pending: false, message: null });
        setFeedback({
          title: '변경사항이 저장되었습니다',
          description: '확인을 누르면 목록을 새로고침합니다.',
        });
        return;
      }

      setActionState({
        pending: false,
        message: result.error ?? '작업을 완료하지 못했습니다.',
      });
    });
  };

  const updateDraft = (key: AdminPermissionKey, value: boolean) => {
    if (selectedIsSuperAdmin) {
      return;
    }

    setDraft((current) => ({ ...current, [key]: value }));
  };

  const setAllDraft = (value: boolean) => {
    if (selectedIsSuperAdmin) {
      return;
    }

    setDraft(
      permissionDefinitions.reduce<Partial<Record<AdminPermissionKey, boolean>>>(
        (next, definition) => {
          next[definition.key] = value;
          return next;
        },
        {},
      ),
    );
  };

  const handleSave = () => {
    if (!selectedAdmin || selectedIsSuperAdmin) {
      return;
    }

    runAction(() => updateAdminPermissionsFromWeb(selectedAdmin.id, draft));
  };

  const handleDismiss = () => {
    if (!selectedAdmin || selectedIsSuperAdmin) {
      return;
    }

    setConfirmDismissOpen(true);
  };

  const handleAppoint = () => {
    if (!candidateId) {
      setActionState({ pending: false, message: '임명할 일반 사용자가 없습니다.' });
      return;
    }

    runAction(() => appointAdminFromWeb(candidateId));
  };

  return (
    <div className="space-y-5">
      <ActionConfirmDialog
        open={confirmDismissOpen}
        title={
          selectedAdmin
            ? `${getProfileDisplayName(selectedAdmin)} 관리자를 해임할까요?`
            : '관리자를 해임할까요?'
        }
        description="해임 후에는 일반 사용자 권한으로 돌아갑니다."
        confirmLabel="해임"
        onCancel={() => setConfirmDismissOpen(false)}
        onConfirm={() => {
          if (!selectedAdmin) {
            return;
          }
          setConfirmDismissOpen(false);
          runAction(() => dismissAdminFromWeb(selectedAdmin.id));
        }}
      />
      <ActionFeedbackDialog
        open={feedback !== null}
        title={feedback?.title ?? ''}
        description={feedback?.description}
        tone={feedback?.tone}
        onConfirm={() => {
          setFeedback(null);
          window.location.reload();
        }}
      />
      <section className="bg-card rounded-xl border border-border p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1">
            <label className="text-xs font-semibold text-muted-foreground" htmlFor="admin-candidate">
              관리자 임명 대상
            </label>
            <select
              id="admin-candidate"
              value={candidateId}
              onChange={(event) => setCandidateId(event.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              disabled={userCandidates.length === 0 || isPending}
            >
              {userCandidates.length === 0 ? (
                <option value="">임명 가능한 일반 사용자가 없습니다</option>
              ) : (
                userCandidates.map((user) => (
                  <option key={user.id} value={user.id}>
                    {getProfileDisplayName(user)} · {user.email ?? user.username ?? user.id}
                  </option>
                ))
              )}
            </select>
          </div>
          <button
            type="button"
            onClick={handleAppoint}
            disabled={userCandidates.length === 0 || isPending}
            className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center justify-center gap-2 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <UserPlus className="size-4" />
            관리자 임명
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <section className="lg:col-span-2 bg-card rounded-xl border border-border overflow-hidden h-fit">
          <header className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-display font-bold text-foreground">관리자 ({admins.length})</h2>
          </header>
          <ul className="divide-y divide-border">
            {admins.length === 0 ? (
              <li className="px-5 py-8 text-center text-sm text-muted-foreground">
                관리자 데이터가 없습니다.
              </li>
            ) : (
              admins.map((admin) => {
                const name = getProfileDisplayName(admin);
                const isSuper = admin.role === 'super_admin';
                const isSelected = admin.id === selectedAdmin?.id;
                return (
                  <li key={admin.id}>
                    <button
                      type="button"
                      onClick={() => selectAdmin(admin)}
                      className={`w-full px-5 py-4 flex items-center gap-3 text-left ${
                        isSelected ? 'bg-secondary/60' : 'hover:bg-secondary/40'
                      }`}
                    >
                      <div className="size-10 rounded-full bg-primary text-primary-foreground grid place-items-center font-bold text-sm">
                        {name.slice(0, 1)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground flex items-center gap-1.5">
                          {name}
                          {isSuper && <Crown className="size-3.5 text-accent" />}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {admin.email ?? admin.username ?? admin.id}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                          isSuper
                            ? 'bg-accent text-accent-foreground'
                            : 'bg-primary/10 text-primary'
                        }`}
                      >
                        {getRoleLabel(admin.role)}
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </section>

        <section className="lg:col-span-3 bg-card rounded-xl border border-border">
          {selectedAdmin ? (
            <>
              <header className="px-6 py-5 border-b border-border flex items-center gap-4">
                <div className="size-12 rounded-full bg-primary text-primary-foreground grid place-items-center font-display font-bold">
                  {getProfileDisplayName(selectedAdmin).slice(0, 1)}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-display font-bold text-foreground text-lg">
                    {getProfileDisplayName(selectedAdmin)}
                  </h2>
                  <p className="text-xs text-muted-foreground truncate">
                    {selectedAdmin.email ?? selectedAdmin.username ?? selectedAdmin.id} ·{' '}
                    {getRoleLabel(selectedAdmin.role)} · {selectedAdmin.status}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDismiss}
                  disabled={selectedIsSuperAdmin || isPending}
                  className="h-9 px-3 rounded-lg border border-destructive/30 text-destructive text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <UserMinus className="size-3.5" />
                  관리자 해임
                </button>
              </header>

              <div className="p-6">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="font-display font-bold text-foreground">권한 설정</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      DB의 admin_permissions 값을 직접 변경합니다.
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setAllDraft(false)}
                      disabled={selectedIsSuperAdmin || isPending}
                      className="text-xs font-semibold px-2.5 h-7 rounded-md hover:bg-secondary disabled:opacity-40"
                    >
                      전체 해제
                    </button>
                    <button
                      type="button"
                      onClick={() => setAllDraft(true)}
                      disabled={selectedIsSuperAdmin || isPending}
                      className="text-xs font-semibold px-2.5 h-7 rounded-md hover:bg-secondary disabled:opacity-40"
                    >
                      전체 선택
                    </button>
                  </div>
                </div>

                <ul className="divide-y divide-border border border-border rounded-xl overflow-hidden">
                  {permissionDefinitions.map((permission) => {
                    const enabled = selectedIsSuperAdmin || draft[permission.key] === true;
                    return (
                      <li
                        key={permission.key}
                        className="flex items-center gap-3 px-4 py-3 bg-card hover:bg-secondary/40"
                      >
                        <span className="flex-1 text-sm font-medium text-foreground">
                          {permission.label}
                          <span className="block text-xs font-normal text-muted-foreground mt-0.5">
                            {permission.description}
                          </span>
                        </span>
                        {selectedIsSuperAdmin ? (
                          <span className="text-[10px] font-bold text-accent-foreground bg-accent px-1.5 py-0.5 rounded">
                            항상 허용
                          </span>
                        ) : null}
                        <ToggleButton
                          enabled={enabled}
                          disabled={selectedIsSuperAdmin || isPending}
                          onClick={() => updateDraft(permission.key, !enabled)}
                        />
                      </li>
                    );
                  })}
                </ul>

                <div className="mt-6 flex items-center gap-2 p-3 rounded-xl bg-accent/30 text-foreground text-xs">
                  <ShieldCheck className="size-4 text-primary shrink-0" />
                  슈퍼 관리자는 세부 권한 row가 없어도 모든 권한을 통과합니다.
                </div>

                {actionState.message ? (
                  <p className="mt-4 text-sm text-destructive">{actionState.message}</p>
                ) : null}

                <div className="mt-5 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setDraft(copyPermissions(selectedAdmin.permissions))}
                    disabled={selectedIsSuperAdmin || isPending}
                    className="h-10 px-4 rounded-lg border border-border text-sm font-semibold hover:bg-secondary disabled:opacity-40"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={selectedIsSuperAdmin || isPending}
                    className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 inline-flex items-center gap-1.5 disabled:opacity-40"
                  >
                    {isPending || actionState.pending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Check className="size-4" />
                    )}
                    권한 저장
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-sm text-muted-foreground">선택할 관리자가 없습니다.</div>
          )}
        </section>
      </div>
    </div>
  );
}

export function MenuSettingsControls({
  initialSettings,
  updatedAt,
}: {
  initialSettings: MenuSettings;
  updatedAt: string | null;
}) {
  const [settings, setSettings] = useState(initialSettings);
  const [pendingMenuId, setPendingMenuId] = useState<MenuId | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const activeCounts = useMemo(
    () =>
      menuGroups.reduce<Record<string, number>>((counts, group) => {
        counts[group.section] = group.items.filter((item) => settings[item.id]).length;
        return counts;
      }, {}),
    [settings],
  );

  const handleToggle = async (menuId: MenuId, nextEnabled: boolean) => {
    setPendingMenuId(menuId);
    setMessage(null);
    const previousSettings = settings;
    setSettings((current) => ({ ...current, [menuId]: nextEnabled, 'audit-log': true }));

    const result = await updateMenuSettingFromWeb(menuId, nextEnabled);
    if (!result.success) {
      setSettings(previousSettings);
      setMessage(result.error ?? '메뉴 설정을 저장하지 못했습니다.');
    } else if (result.settings) {
      setSettings(result.settings);
    }

    setPendingMenuId(null);
  };

  return (
    <div className="space-y-5">
      {updatedAt ? (
        <p className="text-xs text-muted-foreground">마지막 저장: {updatedAt}</p>
      ) : (
        <p className="text-xs text-muted-foreground">
          저장된 DB 설정이 없어 기본 메뉴 상태를 표시합니다.
        </p>
      )}
      {message ? <p className="text-sm text-destructive">{message}</p> : null}

      {menuGroups.map((group) => (
        <section key={group.section} className="bg-card rounded-xl border border-border overflow-hidden">
          <header className="px-6 py-4 border-b border-border flex items-center gap-2">
            <ToggleRight className="size-4 text-primary" />
            <h2 className="font-display font-bold text-foreground">{group.section}</h2>
            <span className="text-xs text-muted-foreground ml-auto">
              {activeCounts[group.section]}/{group.items.length} 활성
            </span>
          </header>
          <ul className="divide-y divide-border">
            {group.items.map((item) => {
              const enabled = settings[item.id];
              const pending = pendingMenuId === item.id;

              return (
                <li key={item.id} className="px-6 py-4 flex items-center gap-4 hover:bg-secondary/40">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground flex items-center gap-2">
                      {item.label}
                      {item.locked ? (
                        <span className="text-[10px] font-bold bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                          잠금
                        </span>
                      ) : null}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                      enabled ? 'bg-chart-4/15 text-chart-4' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {enabled ? 'ON' : 'OFF'}
                  </span>
                  {pending ? (
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  ) : (
                    <ToggleButton
                      enabled={enabled}
                      disabled={item.locked}
                      onClick={() => handleToggle(item.id, !enabled)}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

function ToggleButton({
  enabled,
  disabled,
  onClick,
}: {
  enabled: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-11 h-6 rounded-full transition inline-flex items-center ${
        disabled
          ? 'bg-muted cursor-not-allowed opacity-70'
          : enabled
            ? 'bg-primary'
            : 'bg-secondary border border-border'
      }`}
      aria-pressed={enabled}
      disabled={disabled}
    >
      <span className="sr-only">{enabled ? '비활성화' : '활성화'}</span>
      {enabled ? (
        <ToggleRight className="sr-only" />
      ) : (
        <ToggleLeft className="sr-only" />
      )}
      <span
        className={`absolute top-0.5 size-5 rounded-full bg-card shadow transition-all ${
          enabled ? 'left-[22px]' : 'left-0.5'
        }`}
      />
    </button>
  );
}
