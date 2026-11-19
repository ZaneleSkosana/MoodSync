export const formatCount = (value) => {
  const number = Number(value) || 0;

  if (number >= 1000000) {
    return `${(number / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  }

  if (number >= 10000) {
    return `${(number / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  }

  return number.toLocaleString('en-ZA');
};

export const formatCurrency = (value) => {
  const number = Number(value) || 0;
  return `R${number.toLocaleString('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const getInitials = (name, email) => {
  const source = String(name || '').trim() || String(email || '').split('@')[0] || '?';
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const formatDate = (value) => {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDateTime = (value) => {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return `${formatDate(value)}, ${date.toLocaleTimeString('en-ZA', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
};

export const timeAgo = (value, now = new Date()) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const seconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));

  if (seconds < 60) {
    return 'just now';
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);

  if (days < 30) {
    return `${days}d ago`;
  }

  return formatDate(value);
};

export const describeAction = (entry) => {
  const target = entry?.target_name || 'a user';
  const actor = entry?.admin_name || 'An admin';

  switch (entry?.action) {
    case 'disabled_account':
      return `${actor} disabled ${target}`;
    case 'enabled_account':
      return `${actor} re-enabled ${target}`;
    case 'approved_admin':
      return `${actor} approved ${target} as admin`;
    case 'rejected_admin':
      return `${actor} rejected the admin request from ${target}`;
    default:
      return `${actor} performed an action`;
  }
};
