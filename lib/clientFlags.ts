const parseBooleanEnv = (value: string | undefined, defaultValue: boolean): boolean => {
  if (!value) {
    return defaultValue;
  }

  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return defaultValue;
};

export const enableInviteLocalStorage = parseBooleanEnv(
  process.env.NEXT_PUBLIC_ENABLE_INVITE_LOCAL_STORAGE,
  false,
);
