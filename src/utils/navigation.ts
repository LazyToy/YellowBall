import type { Href, Router } from 'expo-router';

type BackTarget = string | string[] | null | undefined;

const firstTarget = (target: BackTarget) =>
  Array.isArray(target) ? target[0] : target;

export const goBackOrReplace = (
  router: Router,
  fallbackHref: Href,
  explicitTarget?: BackTarget,
) => {
  const target = firstTarget(explicitTarget);

  if (target) {
    router.replace(target as Href);
    return;
  }

  if (router.canGoBack()) {
    router.back();
    return;
  }

  router.replace(fallbackHref);
};
