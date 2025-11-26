/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { getFormsByRole } from '../api';

const WorkflowContext = createContext();

export const useWorkflow = () => {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error('useWorkflow must be used within a WorkflowProvider');
  }
  return context;
};

export const WorkflowProvider = ({ children }) => {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadForms = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getFormsByRole();
      setForms(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load forms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadForms();
  }, []);

  const getStatusLabel = (status) => {
    const statusMap = {
      pending_technician: 'Pending Technician Review',
      technician_submitted: 'Technician Submitted',
      pending_management: 'Pending Management Approval',
      management_approved: 'Management Approved',
      pending_production: 'Pending Production Confirmation',
      production_confirmed: 'Production Confirmed',
      pending_pm: 'Pending PM Review',
      completed: 'Completed',
      rejected: 'Rejected'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      pending_technician: 'bg-yellow-100 text-yellow-800',
      technician_submitted: 'bg-blue-100 text-blue-800',
      pending_management: 'bg-purple-100 text-purple-800',
      management_approved: 'bg-green-100 text-green-800',
      pending_production: 'bg-orange-100 text-orange-800',
      production_confirmed: 'bg-teal-100 text-teal-800',
      pending_pm: 'bg-indigo-100 text-indigo-800',
      completed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  const value = {
    forms,
    loading,
    error,
    loadForms,
    getStatusLabel,
    getStatusColor
  };

  return (
    <WorkflowContext.Provider value={value}>
      {children}
    </WorkflowContext.Provider>
  );
};
