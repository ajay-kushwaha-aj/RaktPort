import { useState } from 'react';
import { BloodGroup, DonationType } from '@/types/bloodbank';
import { BLOOD_GROUPS, getTodayDateString, BLOOD_BANK_LOCATION } from '@/lib/bloodbank-utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface BloodRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BloodRequestFormData) => void;
}

export interface BloodRequestFormData {
  patientName: string;
  bloodGroup: BloodGroup;
  units: number;
  city: string;
  requiredDate: string;
  requiredTime: string;
}

export const BloodRequestModal = ({
  isOpen,
  onClose,
  onSubmit,
}: BloodRequestModalProps) => {
  const [formData, setFormData] = useState<BloodRequestFormData>({
    patientName: '',
    bloodGroup: 'O+',
    units: 1,
    city: 'New Delhi',
    requiredDate: getTodayDateString(),
    requiredTime: '12:00',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      patientName: '',
      bloodGroup: 'O+',
      units: 1,
      city: 'New Delhi',
      requiredDate: getTodayDateString(),
      requiredTime: '12:00',
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            🩸 Request Blood
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="patientName">Patient Full Name</Label>
            <Input
              id="patientName"
              value={formData.patientName}
              onChange={(e) =>
                setFormData({ ...formData, patientName: e.target.value })
              }
              placeholder="e.g., Rajesh Kumar"
              required
            />
          </div>

          <div>
            <Label htmlFor="unitsRequired">Required Units (Min 1)</Label>
            <Input
              id="unitsRequired"
              type="number"
              min={1}
              value={formData.units}
              onChange={(e) =>
                setFormData({ ...formData, units: parseInt(e.target.value) || 1 })
              }
              placeholder="e.g., 2"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bloodGroup">Required Blood Group</Label>
              <Select
                value={formData.bloodGroup}
                onValueChange={(value) =>
                  setFormData({ ...formData, bloodGroup: value as BloodGroup })
                }
              >
                <SelectTrigger id="bloodGroup">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BLOOD_GROUPS.map((bg) => (
                    <SelectItem key={bg} value={bg}>
                      {bg}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g., New Delhi"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="requiredByDate">Required Date</Label>
              <Input
                id="requiredByDate"
                type="date"
                value={formData.requiredDate}
                onChange={(e) =>
                  setFormData({ ...formData, requiredDate: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="requiredByTime">Required Time</Label>
              <Input
                id="requiredByTime"
                type="time"
                value={formData.requiredTime}
                onChange={(e) =>
                  setFormData({ ...formData, requiredTime: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="hospitalNameInput">Hospital Name (Auto-Verified)</Label>
            <Input
              id="hospitalNameInput"
              value={BLOOD_BANK_LOCATION}
              disabled
              className="bg-muted italic"
            />
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary-dark">
              Submit Request & Generate RTID
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
