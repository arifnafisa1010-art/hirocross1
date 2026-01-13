import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useTestNorms, TestNorm } from '@/hooks/useTestNorms';
import { Loader2 } from 'lucide-react';

const categoryLabels: Record<string, string> = {
  'Strength': 'Kekuatan',
  'Speed': 'Kecepatan',
  'Endurance': 'Daya Tahan',
  'Technique': 'Teknik',
  'Tactic': 'Taktik',
};

const ageGroups = [
  { value: '13-15', label: '13-15 tahun', min: 13, max: 15 },
  { value: '16-18', label: '16-18 tahun', min: 16, max: 18 },
  { value: '19-25', label: '19-25 tahun', min: 19, max: 25 },
  { value: '26-35', label: '26-35 tahun', min: 26, max: 35 },
  { value: '36+', label: '36+ tahun', min: 36, max: 99 },
];

export function TestNormsTable() {
  const { norms, loading } = useTestNorms();
  const [selectedCategory, setSelectedCategory] = useState<string>('Strength');
  const [selectedGender, setSelectedGender] = useState<string>('M');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>('19-25');

  const filteredNorms = useMemo(() => {
    const ageGroup = ageGroups.find(g => g.value === selectedAgeGroup);
    if (!ageGroup) return [];

    return norms.filter(n => 
      n.category === selectedCategory &&
      (n.gender === selectedGender || n.gender === 'ALL') &&
      (n.age_min || 0) <= ageGroup.min &&
      (n.age_max || 99) >= ageGroup.max
    ).sort((a, b) => a.item.localeCompare(b.item));
  }, [norms, selectedCategory, selectedGender, selectedAgeGroup]);

  // Get unique categories from norms
  const categories = useMemo(() => {
    return [...new Set(norms.map(n => n.category))].sort();
  }, [norms]);

  if (loading) {
    return (
      <Card className="border-border shadow-card">
        <CardContent className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 animate-spin text-accent" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border shadow-card">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="text-base">Tabel Norma Tes</CardTitle>
          <div className="flex flex-wrap gap-3">
            <div>
              <Label className="text-[10px] text-muted-foreground uppercase">Kategori</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-32 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {categoryLabels[cat] || cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground uppercase">Jenis Kelamin</Label>
              <Select value={selectedGender} onValueChange={setSelectedGender}>
                <SelectTrigger className="w-32 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Laki-laki</SelectItem>
                  <SelectItem value="F">Perempuan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground uppercase">Kelompok Usia</Label>
              <Select value={selectedAgeGroup} onValueChange={setSelectedAgeGroup}>
                <SelectTrigger className="w-32 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ageGroups.map(g => (
                    <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredNorms.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Tidak ada norma tes untuk filter yang dipilih
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full">
              <thead>
                <tr className="bg-secondary/50">
                  <th className="p-3 text-left text-[10px] font-extrabold text-muted-foreground uppercase">Item Tes</th>
                  <th className="p-3 text-center text-[10px] font-extrabold text-muted-foreground uppercase">Unit</th>
                  <th className="p-3 text-center text-[10px] font-extrabold text-muted-foreground uppercase">
                    <Badge variant="outline" className="bg-destructive/20 text-destructive border-destructive/50">1</Badge>
                    <span className="ml-1 text-[9px]">Kurang</span>
                  </th>
                  <th className="p-3 text-center text-[10px] font-extrabold text-muted-foreground uppercase">
                    <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">2</Badge>
                    <span className="ml-1 text-[9px]">Cukup</span>
                  </th>
                  <th className="p-3 text-center text-[10px] font-extrabold text-muted-foreground uppercase">
                    <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">3</Badge>
                    <span className="ml-1 text-[9px]">Sedang</span>
                  </th>
                  <th className="p-3 text-center text-[10px] font-extrabold text-muted-foreground uppercase">
                    <Badge variant="outline" className="bg-lime-100 text-lime-700 border-lime-300">4</Badge>
                    <span className="ml-1 text-[9px]">Baik</span>
                  </th>
                  <th className="p-3 text-center text-[10px] font-extrabold text-muted-foreground uppercase">
                    <Badge variant="outline" className="bg-success/20 text-success border-success/50">5</Badge>
                    <span className="ml-1 text-[9px]">Sangat Baik</span>
                  </th>
                  <th className="p-3 text-center text-[10px] font-extrabold text-muted-foreground uppercase">Arah</th>
                </tr>
              </thead>
              <tbody>
                {filteredNorms.map((norm) => (
                  <tr key={norm.id} className="border-t border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="p-3 text-sm font-semibold">{norm.item}</td>
                    <td className="p-3 text-sm text-center text-muted-foreground">{norm.unit}</td>
                    <td className="p-3 text-sm text-center font-mono">
                      {norm.lower_is_better ? `>${norm.score_1_max}` : `<${norm.score_2_max}`}
                    </td>
                    <td className="p-3 text-sm text-center font-mono">
                      {norm.lower_is_better 
                        ? `${norm.score_1_max}-${norm.score_2_max}` 
                        : `${norm.score_2_max}-${norm.score_3_max}`}
                    </td>
                    <td className="p-3 text-sm text-center font-mono">
                      {norm.lower_is_better 
                        ? `${norm.score_2_max}-${norm.score_3_max}` 
                        : `${norm.score_3_max}-${norm.score_4_max}`}
                    </td>
                    <td className="p-3 text-sm text-center font-mono">
                      {norm.lower_is_better 
                        ? `${norm.score_3_max}-${norm.score_4_max}` 
                        : `${norm.score_4_max}-${norm.score_5_max}`}
                    </td>
                    <td className="p-3 text-sm text-center font-mono font-bold text-success">
                      {norm.lower_is_better ? `≤${norm.score_5_max}` : `≥${norm.score_5_max}`}
                    </td>
                    <td className="p-3 text-center">
                      <Badge variant="secondary" className="text-[10px]">
                        {norm.lower_is_better ? '↓ Rendah Lebih Baik' : '↑ Tinggi Lebih Baik'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-[10px] text-muted-foreground mt-3">
          * Norma berdasarkan standar internasional dan disesuaikan untuk atlet Indonesia
        </p>
      </CardContent>
    </Card>
  );
}
