function getValueFromLocalStorage(key: string) {
  const value = localStorage.getItem(key);
  if (value) return JSON.parse(value);
  return null;
}

function setValueToLocalStorage(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

function deleteValueFromStorage(key: string) {
  localStorage.removeItem(key);
}

export {
  getValueFromLocalStorage,
  setValueToLocalStorage,
  deleteValueFromStorage,
};
