export const IDLE_MS=60000;
export function activityState({visible,lastInteraction,now}){return !visible?'background':now-lastInteraction>=IDLE_MS?'idle':'active'}
