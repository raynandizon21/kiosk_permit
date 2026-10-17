import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import ProtectedRoute from './components/ProtectedRoute';
import { KioskFrame } from './components/kiosk/KioskFrame';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminOverview } from './components/admin/AdminOverview';
import { AdminStudentLedger } from './components/admin/AdminStudentLedger';
import { AdminPromissoryWorkbench } from './components/admin/AdminPromissoryWorkbench';
import { AdminWithdrawalRequests } from './components/admin/AdminWithdrawalRequests';
import { AdminActivityLogs } from './components/admin/AdminActivityLogs';
import { AdminStudentList } from './components/admin/maintenance/AdminStudentList';
import { AdminAssessments } from './components/admin/maintenance/AdminAssessments';
import { AdminCourses, AdminPeriods, AdminSubjects, AdminUsers } from './components/admin/maintenance/MaintenancePages';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/kiosk" replace />} />
            <Route path="/kiosk" element={<KioskFrame />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminOverview />} />
              <Route path="students" element={<AdminStudentLedger />} />
              <Route path="promissory-notes" element={<AdminPromissoryWorkbench />} />
              <Route path="withdrawals" element={<AdminWithdrawalRequests />} />
              <Route path="logs" element={<AdminActivityLogs />} />
              <Route path="maintenance/students" element={<AdminStudentList />} />
              <Route path="maintenance/assessments" element={<AdminAssessments />} />
              <Route path="maintenance/courses" element={<AdminCourses />} />
              <Route path="maintenance/subjects" element={<AdminSubjects />} />
              <Route path="maintenance/periods" element={<AdminPeriods />} />
              <Route path="maintenance/users" element={<AdminUsers />} />
            </Route>
            <Route path="*" element={<Navigate to="/kiosk" replace />} />
          </Routes>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
