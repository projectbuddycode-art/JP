export function formAction(
  fn: (formData: FormData) => Promise<unknown>,
): (formData: FormData) => Promise<void> {
  return async (formData: FormData) => {
    await fn(formData);
  };
}

export function boundAction(
  fn: () => Promise<unknown>,
): (formData: FormData) => Promise<void> {
  return async () => {
    await fn();
  };
}
