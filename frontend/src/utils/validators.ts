export const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const re = /^[\d\s\-\+\(\)]+$/;
  return phone.length >= 9 && re.test(phone);
};

export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < 6) {
    errors.push('Hasło musi mieć co najmniej 6 znaków');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Hasło powinno zawierać co najmniej jedną wielką literę');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Hasło powinno zawierać co najmniej jedną małą literę');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Hasło powinno zawierać co najmniej jedną cyfrę');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

export const validateLogin = (login: string): { valid: boolean; error?: string } => {
  if (login.length < 3) {
    return { valid: false, error: 'Login musi mieć co najmniej 3 znaki' };
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(login)) {
    return { valid: false, error: 'Login może zawierać tylko litery, cyfry, _ i -' };
  }

  return { valid: true };
};

export const validateApartmentNumber = (number: string): boolean => {
  return number.trim().length > 0;
};
