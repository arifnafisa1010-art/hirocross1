import { useState } from 'react';
import { useAthletes, Athlete } from '@/hooks/useAthletes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LinkAthleteDialog } from '@/components/LinkAthleteDialog';
import { Users, Plus, Pencil, Trash2, Link2, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export function AthletesManagement() {
  const { athletes, loading, addAthlete, updateAthlete, deleteAthlete, refetch } = useAthletes();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingAthlete, setEditingAthlete] = useState<Athlete | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    sport: '',
    position: '',
    gender: '',
    birth_date: '',
    height: '',
    weight: '',
    resting_hr: '60',
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      sport: '',
      position: '',
      gender: '',
      birth_date: '',
      height: '',
      weight: '',
      resting_hr: '60',
      notes: '',
    });
  };

  const handleAdd = async () => {
    if (!formData.name.trim()) {
      toast.error('Nama atlet wajib diisi');
      return;
    }

    const result = await addAthlete({
      name: formData.name,
      sport: formData.sport || null,
      position: formData.position || null,
      gender: formData.gender || null,
      birth_date: formData.birth_date || null,
      height: formData.height ? parseFloat(formData.height) : null,
      weight: formData.weight ? parseFloat(formData.weight) : null,
      resting_hr: formData.resting_hr ? parseInt(formData.resting_hr) : 60,
      notes: formData.notes || null,
    });

    if (result) {
      setAddDialogOpen(false);
      resetForm();
    }
  };

  const handleEdit = async () => {
    if (!editingAthlete || !formData.name.trim()) return;

    const success = await updateAthlete(editingAthlete.id, {
      name: formData.name,
      sport: formData.sport || null,
      position: formData.position || null,
      gender: formData.gender || null,
      birth_date: formData.birth_date || null,
      height: formData.height ? parseFloat(formData.height) : null,
      weight: formData.weight ? parseFloat(formData.weight) : null,
      resting_hr: formData.resting_hr ? parseInt(formData.resting_hr) : 60,
      notes: formData.notes || null,
    });

    if (success) {
      setEditingAthlete(null);
      resetForm();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus atlet ini?')) return;
    await deleteAthlete(id);
  };

  const openEditDialog = (athlete: Athlete) => {
    setEditingAthlete(athlete);
    setFormData({
      name: athlete.name,
      sport: athlete.sport || '',
      position: athlete.position || '',
      gender: athlete.gender || '',
      birth_date: athlete.birth_date || '',
      height: athlete.height?.toString() || '',
      weight: athlete.weight?.toString() || '',
      resting_hr: athlete.resting_hr?.toString() || '60',
      notes: athlete.notes || '',
    });
  };

  const getLinkStatus = (athlete: Athlete) => {
    if (athlete.linked_user_id) {
      return { status: 'linked', label: 'Terhubung', color: 'bg-green-500' };
    }
    if (athlete.pending_link_email) {
      return { status: 'pending', label: 'Menunggu', color: 'bg-yellow-500' };
    }
    return { status: 'none', label: 'Belum', color: 'bg-gray-400' };
  };

  const athleteFormContent = (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nama *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Nama atlet"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <select
            id="gender"
            value={formData.gender}
            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Pilih gender</option>
            <option value="Male">Laki-laki</option>
            <option value="Female">Perempuan</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sport">Cabang Olahraga</Label>
          <Input
            id="sport"
            value={formData.sport}
            onChange={(e) => setFormData({ ...formData, sport: e.target.value })}
            placeholder="Sepak bola, basket, dll"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="position">Posisi</Label>
          <Input
            id="position"
            value={formData.position}
            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
            placeholder="Striker, guard, dll"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="birth_date">Tanggal Lahir</Label>
          <Input
            id="birth_date"
            type="date"
            value={formData.birth_date}
            onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="height">Tinggi (cm)</Label>
          <Input
            id="height"
            type="number"
            value={formData.height}
            onChange={(e) => setFormData({ ...formData, height: e.target.value })}
            placeholder="170"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="weight">Berat (kg)</Label>
          <Input
            id="weight"
            type="number"
            value={formData.weight}
            onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
            placeholder="65"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="resting_hr">Denyut Jantung Istirahat</Label>
        <Input
          id="resting_hr"
          type="number"
          value={formData.resting_hr}
          onChange={(e) => setFormData({ ...formData, resting_hr: e.target.value })}
          placeholder="60"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Catatan</Label>
        <Input
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Catatan tambahan"
        />
      </div>
    </div>
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Manajemen Atlet
        </CardTitle>
        <Dialog open={addDialogOpen} onOpenChange={(open) => { setAddDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Atlet
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Tambah Atlet Baru</DialogTitle>
            </DialogHeader>
            {athleteFormContent}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setAddDialogOpen(false); resetForm(); }}>
                Batal
              </Button>
              <Button onClick={handleAdd}>Simpan</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {athletes.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Belum ada atlet. Klik "Tambah Atlet" untuk memulai.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Olahraga</TableHead>
                <TableHead>Posisi</TableHead>
                <TableHead>Status Link</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {athletes.map((athlete) => {
                const linkStatus = getLinkStatus(athlete);
                return (
                  <TableRow key={athlete.id}>
                    <TableCell className="font-medium">{athlete.name}</TableCell>
                    <TableCell>{athlete.sport || '-'}</TableCell>
                    <TableCell>{athlete.position || '-'}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className={`${linkStatus.color} text-white`}
                      >
                        {linkStatus.status === 'linked' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {linkStatus.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                        {linkStatus.status === 'none' && <Link2 className="h-3 w-3 mr-1" />}
                        {linkStatus.label}
                      </Badge>
                      {athlete.pending_link_email && (
                        <span className="text-xs text-muted-foreground ml-2">
                          {athlete.pending_link_email}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <LinkAthleteDialog athlete={athlete} onSuccess={refetch} />
                        <Dialog 
                          open={editingAthlete?.id === athlete.id} 
                          onOpenChange={(open) => { if (!open) { setEditingAthlete(null); resetForm(); } }}
                        >
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => openEditDialog(athlete)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg">
                            <DialogHeader>
                              <DialogTitle>Edit Atlet</DialogTitle>
                            </DialogHeader>
                            {athleteFormContent}
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" onClick={() => { setEditingAthlete(null); resetForm(); }}>
                                Batal
                              </Button>
                              <Button onClick={handleEdit}>Simpan</Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDelete(athlete.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
