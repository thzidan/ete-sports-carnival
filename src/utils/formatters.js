export const formatDate = (value) => {
  if (!value) {
    return 'TBD';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
};

export const formatDateTime = (value) => {
  if (!value) {
    return 'TBD';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
};

export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount ?? 0));

export const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

export const getStatusTone = (status) => {
  switch (status) {
    case 'live':
      return 'border-success/50 bg-success/10 text-success';
    case 'completed':
      return 'border-brand-teal/40 bg-brand-teal/10 text-brand-teal';
    default:
      return 'border-warning/40 bg-warning/10 text-warning';
  }
};

export const getRankTone = (rank) => {
  if (rank === 1) {
    return 'bg-brand-lime text-black';
  }

  if (rank === 2) {
    return 'bg-brand-teal text-black';
  }

  if (rank === 3) {
    return 'bg-brand-blue text-copy';
  }

  return 'border border-divider bg-[#141414] text-copy';
};

export const getPositionTone = (position) => {
  const map = {
    Goalkeeper: 'border-warning/40 bg-warning/10 text-warning',
    Defender: 'border-brand-blue/40 bg-brand-blue/10 text-blue-300',
    Midfielder: 'border-brand-teal/40 bg-brand-teal/10 text-brand-teal',
    Forward: 'border-danger/40 bg-danger/10 text-red-300',
  };

  return map[position] ?? 'border-divider bg-[#141414] text-copy';
};

export const positionOptions = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'];