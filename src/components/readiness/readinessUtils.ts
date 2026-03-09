export function getReadinessInfo(score: number) {
  if (score > 2.0) return { label: 'Sangat Siap', color: 'bg-green-500', textColor: 'text-green-700', recommendation: 'Latihan intensitas tinggi', zone: 'supercompensation' };
  if (score >= 1.8) return { label: 'Normal', color: 'bg-blue-500', textColor: 'text-blue-700', recommendation: 'Latihan sesuai program', zone: 'normal' };
  if (score >= 1.6) return { label: 'Mulai Fatigue', color: 'bg-amber-500', textColor: 'text-amber-700', recommendation: 'Kurangi intensitas', zone: 'fatigue' };
  return { label: 'Fatigue Tinggi', color: 'bg-red-500', textColor: 'text-red-700', recommendation: 'Recovery / rest', zone: 'danger' };
}
