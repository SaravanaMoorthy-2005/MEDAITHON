import React, { useState } from 'react';
import { Staff } from '../types';
import { StaffModal } from '../components/StaffModal';
import { hospitalStore } from '../services/hospitalStore';
import { IconStaff } from '../icons';

interface StaffPageProps {
  staffList: Staff[];
}

export const StaffPage: React.FC<StaffPageProps> = ({ staffList }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  const filteredStaff = staffList.filter((s) => {
    if (roleFilter !== 'All' && s.role !== roleFilter) return false;
    if (searchTerm) {
      const match =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.rfidUid.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.department.toLowerCase().includes(searchTerm.toLowerCase());
      if (!match) return false;
    }
    return true;
  });

  const handleOpenAdd = () => {
    setEditingStaff(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (staff: Staff) => {
    setEditingStaff(staff);
    setIsModalOpen(true);
  };

  const handleToggleStatus = (id: string) => {
    hospitalStore.toggleStaffStatus(id);
  };

  const handleSaveStaff = (staffData: Omit<Staff, 'id'>, id?: string) => {
    if (id) {
      hospitalStore.updateStaff(id, staffData);
    } else {
      hospitalStore.addStaff(staffData);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div>
          <h2>STAFF MANAGEMENT</h2>
          <p className="page-subtitle">
            Healthcare worker RFID credentials and clinical department assignments
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAdd}
          className="btn btn-primary"
        >
          + ADD NEW STAFF
        </button>
      </div>

      <div className="filters-bar">
        <div className="filter-item search-item">
          <label>Search Staff:</label>
          <input
            type="text"
            placeholder="Search by name, ID, RFID UID, department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="filter-input"
          />
        </div>

        <div className="filter-item">
          <label>Filter Role:</label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="filter-select"
          >
            <option value="All">All Roles</option>
            <option value="Doctor">Doctor</option>
            <option value="Nurse">Nurse</option>
            <option value="Technician">Technician</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      <div className="dashboard-panel full-width">
        <div className="table-responsive">
          <table className="ops-table">
            <thead>
              <tr>
                <th>Staff ID</th>
                <th>Name</th>
                <th>Role</th>
                <th>Department</th>
                <th>RFID UID</th>
                <th>Primary Ward</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty-cell">
                    No healthcare staff records matched the search filters.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => (
                  <tr key={staff.id}>
                    <td className="mono-code">{staff.id}</td>
                    <td className="bold-cell">
                      <IconStaff size={14} className="inline-icon" />
                      {staff.name}
                    </td>
                    <td>
                      <span className="role-tag">{staff.role}</span>
                    </td>
                    <td>{staff.department}</td>
                    <td>
                      <span className="rfid-tag">{staff.rfidUid}</span>
                    </td>
                    <td>{staff.ward}</td>
                    <td>
                      <span
                        className={`status-pill ${
                          staff.status === 'Active' ? 'pill-active' : 'pill-inactive'
                        }`}
                      >
                        {staff.status}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(staff)}
                          className="btn-table-action"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(staff.id)}
                          className={`btn-table-action ${
                            staff.status === 'Active' ? 'btn-warn' : 'btn-activate'
                          }`}
                        >
                          {staff.status === 'Active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <StaffModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveStaff}
        staffToEdit={editingStaff}
      />
    </div>
  );
};
