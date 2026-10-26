import React, { useState, useEffect } from 'react';
import { Staff, StaffRole, WardType } from '../types';

interface StaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (staffData: Omit<Staff, 'id'>, id?: string) => void;
  staffToEdit?: Staff | null;
}

export const StaffModal: React.FC<StaffModalProps> = ({
  isOpen,
  onClose,
  onSave,
  staffToEdit,
}) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState<StaffRole>('Nurse');
  const [department, setDepartment] = useState('Nursing');
  const [rfidUid, setRfidUid] = useState('');
  const [ward, setWard] = useState<WardType>('General Ward');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');

  useEffect(() => {
    if (staffToEdit) {
      setName(staffToEdit.name);
      setRole(staffToEdit.role);
      setDepartment(staffToEdit.department);
      setRfidUid(staffToEdit.rfidUid);
      setWard(staffToEdit.ward);
      setStatus(staffToEdit.status);
    } else {
      setName('');
      setRole('Nurse');
      setDepartment('Nursing');
      setRfidUid('RFID-' + Math.floor(1000 + Math.random() * 9000));
      setWard('General Ward');
      setStatus('Active');
    }
  }, [staffToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(
      {
        name,
        role,
        department,
        rfidUid,
        ward,
        status,
      },
      staffToEdit?.id
    );
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-box">
        <div className="modal-header">
          <h3>{staffToEdit ? 'EDIT HEALTHCARE WORKER' : 'REGISTER NEW STAFF'}</h3>
          <button type="button" onClick={onClose} className="modal-close-btn">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>Full Name:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-control"
              placeholder="e.g. Dr. Sarah Jenkins"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group half">
              <label>Role:</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as StaffRole)}
                className="form-control"
              >
                <option value="Doctor">Doctor</option>
                <option value="Nurse">Nurse</option>
                <option value="Technician">Technician</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group half">
              <label>Department:</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="form-control"
                placeholder="e.g. Cardiology"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group half">
              <label>RFID Badge UID:</label>
              <input
                type="text"
                value={rfidUid}
                onChange={(e) => setRfidUid(e.target.value)}
                className="form-control"
                placeholder="e.g. RFID-2004"
                required
              />
            </div>

            <div className="form-group half">
              <label>Primary Ward:</label>
              <select
                value={ward}
                onChange={(e) => setWard(e.target.value as WardType)}
                className="form-control"
              >
                <option value="General Ward">General Ward</option>
                <option value="ICU">ICU</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Badge Status:</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'Active' | 'Inactive')}
              className="form-control"
            >
              <option value="Active">Active (Permitted)</option>
              <option value="Inactive">Inactive / Revoked (Access Flagged)</option>
            </select>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              {staffToEdit ? 'SAVE CHANGES' : 'CREATE STAFF RECORD'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
