const VALID_ROLES = [
  'Principal',
  'Academic Coordinator',
  'Teacher',
  'Registrar',
  'Accountant',
  'Librarian',
  'Parent',
  'Student'
];

const ROLE_ALIASES = {
  'principal': 'Principal',
  'executive': 'Principal',
  'admin': 'Principal',
  'administrator': 'Principal',
  'academic coordinator': 'Academic Coordinator',
  'coordinator': 'Academic Coordinator',
  'teacher': 'Teacher',
  'faculty': 'Teacher',
  'accountant': 'Accountant',
  'bursar': 'Accountant',
  'finance': 'Accountant',
  'registrar': 'Registrar',
  'admissions': 'Registrar',
  'librarian': 'Librarian',
  'transport': 'Librarian',
  'nurse': 'Librarian',
  'guard': 'Librarian',
  'parent': 'Parent',
  'guardian': 'Parent',
  'student': 'Student'
};

const ROLE_PERMISSIONS = {
  'Principal': {
    canSearchStudents: true,
    canSearchStaff: true,
    canViewStaffSalary: true,
    canSearchFees: true,
    canViewFeeAmounts: true,
    canSearchAdmissions: true,
    canViewAdmissionsConfidential: true,
    canSearchStore: true
  },
  'Academic Coordinator': {
    canSearchStudents: true,
    canSearchStaff: true,
    canViewStaffSalary: false,
    canSearchFees: false,
    canViewFeeAmounts: false,
    canSearchAdmissions: false,
    canViewAdmissionsConfidential: false,
    canSearchStore: true
  },
  'Teacher': {
    canSearchStudents: true,
    canSearchStaff: true,
    canViewStaffSalary: false,
    canSearchFees: false,
    canViewFeeAmounts: false,
    canSearchAdmissions: false,
    canViewAdmissionsConfidential: false,
    canSearchStore: true
  },
  'Registrar': {
    canSearchStudents: true,
    canSearchStaff: true,
    canViewStaffSalary: false,
    canSearchFees: false,
    canViewFeeAmounts: false,
    canSearchAdmissions: true,
    canViewAdmissionsConfidential: true,
    canSearchStore: true
  },
  'Accountant': {
    canSearchStudents: true,
    canSearchStaff: true,
    canViewStaffSalary: true,
    canSearchFees: true,
    canViewFeeAmounts: true,
    canSearchAdmissions: false,
    canViewAdmissionsConfidential: false,
    canSearchStore: true
  },
  'Librarian': {
    canSearchStudents: true,
    canSearchStaff: true,
    canViewStaffSalary: false,
    canSearchFees: false,
    canViewFeeAmounts: false,
    canSearchAdmissions: false,
    canViewAdmissionsConfidential: false,
    canSearchStore: true
  },
  'Parent': {
    canSearchStudents: false,
    canSearchStaff: true,
    canViewStaffSalary: false,
    canSearchFees: false,
    canViewFeeAmounts: false,
    canSearchAdmissions: false,
    canViewAdmissionsConfidential: false,
    canSearchStore: true
  },
  'Student': {
    canSearchStudents: false,
    canSearchStaff: true,
    canViewStaffSalary: false,
    canSearchFees: false,
    canViewFeeAmounts: false,
    canSearchAdmissions: false,
    canViewAdmissionsConfidential: false,
    canSearchStore: true
  }
};

module.exports = {
  VALID_ROLES,
  ROLE_ALIASES,
  ROLE_PERMISSIONS
};
