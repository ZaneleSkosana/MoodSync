export const getFriendlyAuthError = (message) => {
  const text = String(message || '').toLowerCase();

  if (text.includes('invalid login credentials')) {
    return 'Incorrect email or password. If you do not have an account yet, tap Sign Up.';
  }
  if (text.includes('email not confirmed')) {
    return 'Please confirm your email first. Check your inbox for the confirmation link, then sign in.';
  }
  if (text.includes('banned') || text.includes('disabled')) {
    return 'This account has been disabled by an administrator. Please contact support.';
  }
  if (text.includes('already registered') || text.includes('already been registered')) {
    return 'An account with this email already exists. Please sign in instead.';
  }
  if (text.includes('password') && text.includes('characters')) {
    return 'Your password is too short. Use at least 6 characters.';
  }
  if (text.includes('rate limit') || text.includes('too many')) {
    return 'Too many attempts. Please wait a minute and try again.';
  }
  if (text.includes('network') || text.includes('failed to fetch')) {
    return 'Cannot reach the server. Check your internet connection and try again.';
  }
  return message || 'Something went wrong. Please try again.';
};
