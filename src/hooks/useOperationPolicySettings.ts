import { useEffect, useState } from 'react';

import {
  createDefaultOperationPolicySettings,
  getOperationPolicySettings,
  type OperationPolicySettings,
} from '@/services/operationPolicyService';

export function useOperationPolicySettings(): OperationPolicySettings {
  const [settings, setSettings] = useState<OperationPolicySettings>(() =>
    createDefaultOperationPolicySettings(),
  );

  useEffect(() => {
    let mounted = true;

    getOperationPolicySettings()
      .then((nextSettings) => {
        if (mounted) {
          setSettings(nextSettings);
        }
      })
      .catch(() => {
        if (mounted) {
          setSettings(createDefaultOperationPolicySettings());
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  return settings;
}
