import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatDosageSummary,
  calculateMedicationTotalQuantity,
  calculateDailyDoseSlots,
  generatePrescriptionCode,
  generatePatientCode,
  validatePatientForm,
  validatePrescriptionForm,
} from './medicationSchedule';
import { Prescription, PrescribedMedication } from '../types/medical';

test('formatDosageSummary formats multi-dose schedules correctly', () => {
  const dosage = {
    morning: 1,
    noon: 0,
    afternoon: 0,
    evening: 1,
    timing: 'sau_an' as const,
  };
  const summary = formatDosageSummary(dosage, 'viên');
  assert.equal(summary, 'Sáng 1 viên, Tối 1 viên - Sau khi ăn no (15-30 phút)');
});

test('calculateMedicationTotalQuantity calculates total pills for duration', () => {
  const dosage = {
    morning: 1,
    noon: 1,
    afternoon: 0,
    evening: 1,
    timing: 'sau_an' as const,
  };
  const total = calculateMedicationTotalQuantity(dosage, 10);
  assert.equal(total, 30);
});

test('calculateDailyDoseSlots breaks down prescription for fridge and daily reminder chart', () => {
  const testMed: PrescribedMedication = {
    id: 'm1',
    name: 'Amlor 5mg',
    form: 'viên',
    unit: 'viên',
    totalQuantity: 30,
    dosage: { morning: 1, noon: 0, afternoon: 0, evening: 0, timing: 'sau_an' },
    durationDays: 30,
    instructions: 'Uống sáng sau ăn',
  };

  const rx: Prescription = {
    id: 'rx-1',
    prescriptionCode: 'TOA-20261027-001',
    patientId: 'pat-1',
    patientName: 'Nguyễn Văn An',
    patientBirthYear: 1958,
    patientGender: 'nam',
    clinicInfo: {
      clinicName: 'PHÒNG KHÁM BÁC SĨ TRẦN VĂN DIỆU',
      doctorName: 'BS. Trần Văn Diệu',
      doctorTitle: 'Bác Sĩ Chuyên Khoa',
      specialty: 'Nội Khoa',
      licenseNumber: '12345',
      address: '158 Nguyễn Trãi, Q1',
      phone: '0913678999',
      consultingHours: '07:30 - 19:30',
    },
    examinationDate: '2026-10-27',
    symptoms: 'Chóng mặt',
    diagnosis: 'Tăng huyết áp',
    medications: [testMed],
    doctorAdvice: 'Ăn nhạt',
    status: 'active',
    createdAt: '2026-10-27T00:00:00Z',
    updatedAt: '2026-10-27T00:00:00Z',
  };

  const slots = calculateDailyDoseSlots(rx);
  assert.equal(slots.length, 4);
  const morning = slots.find((s) => s.slot === 'morning');
  assert.equal(morning?.items.length, 1);
  assert.equal(morning?.items[0].medicationName, 'Amlor 5mg');
});

test('generatePatientCode formats code properly', () => {
  const code = generatePatientCode(0);
  const year = new Date().getFullYear();
  assert.equal(code, `BN-${year}-001`);
});

test('validatePatientForm rejects invalid input', () => {
  const res = validatePatientForm({ fullName: '', birthYear: '2099' });
  assert.equal(res.valid, false);
  assert.ok(res.errors.fullName);
  assert.ok(res.errors.birthYear);
});
