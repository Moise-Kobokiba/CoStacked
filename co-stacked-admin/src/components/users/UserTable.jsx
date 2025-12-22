// src/components/users/UserTable.jsx

import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { deleteUser } from '../../features/users/userManagementSlice';
import styles from './UserTable.module.css';

// Import all necessary UI components
import { Badge } from '../ui/Badge';
import { ConfirmationModal } from '../shared/ConfirmationModal';
import { EditUserModal } from './EditUserModal';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import PropTypes from 'prop-types';

export const UserTable = ({ users }) => {
  const dispatch = useDispatch();
  const { status } = useSelector(state => state.userManagement);
  
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      dispatch(deleteUser(userToDelete._id));
    }
    setDeleteModalOpen(false);
    setUserToDelete(null);
  };

  const handleEditClick = (user) => {
    setUserToEdit(user);
    setIsEditModalOpen(true);
  };

  return (
    <>
      <ConfirmationModal
        open={isDeleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete User Account"
        message={`Are you sure you want to permanently delete the user "${userToDelete?.name}"? This action cannot be undone.`}
        confirmText="Yes, Delete User"
      />
      <EditUserModal
        user={userToEdit}
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Admin</th>
              <th>Date Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id}>
                {/* --- MODIFIED: Added data-label attributes to each cell --- */}
                <td data-label="Name">{user.name || 'N/A'}</td>
                <td data-label="Email">{user.email || 'N/A'}</td>
                <td data-label="Role">
                  <Badge text={user.role} variant={user.role === 'founder' ? 'primary' : 'secondary'} />
                </td>
                <td data-label="Admin" className={styles.adminCell}>
                  {user.isAdmin ? (
                    <div className={styles.adminBadges}>
                      <Badge text="Admin" variant="danger" />
                      <Badge text="✓ Verified" variant="verified" />
                    </div>
                  ) : 'No'}
                </td>
                <td data-label="Date Joined">
                  {user.createdAt ? format(new Date(user.createdAt), 'dd MMM, yyyy') : 'N/A'}
                </td>
                <td data-label="Actions" className={styles.actionsCell}>
                  <button onClick={() => handleEditClick(user)}>Edit</button>
                  <button 
                    className={styles.deleteBtn}
                    onClick={() => handleDeleteClick(user)}
                    disabled={status === 'loading' && userToDelete?._id === user._id}
                  >
                    {status === 'loading' && userToDelete?._id === user._id 
                      ? <Loader2 size={14} className={styles.loader} />
                      : 'Delete'
                    }
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

UserTable.propTypes = {
  users: PropTypes.array.isRequired,
};