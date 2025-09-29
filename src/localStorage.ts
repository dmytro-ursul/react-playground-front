export const loadAuthInfo = () => {
  const serializedState = localStorage.getItem('state');
  if (serializedState == null) return;

  return JSON.parse(serializedState);
};

export const saveAuthInfo = (state: any) => {
  const serializedState = JSON.stringify(state.auth);
  localStorage.setItem('state', serializedState);
};
