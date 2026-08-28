const INVITE_INTENT_KEY = "devportal_invite_intent";

export const setInviteIntent = (inviteId: string) => {
  sessionStorage.setItem(INVITE_INTENT_KEY, inviteId);
};

export const peekInviteIntent = (inviteId: string): boolean =>
  sessionStorage.getItem(INVITE_INTENT_KEY) === inviteId;

export const clearInviteIntent = () => {
  sessionStorage.removeItem(INVITE_INTENT_KEY);
};
