import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import { PublicLayout } from '../layouts/PublicLayout';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';

// Public Pages
import { LandingPage } from '../pages/public/LandingPage';
import { LoginPage } from '../pages/public/LoginPage';
import { RegisterPage } from '../pages/public/RegisterPage';

// Survivor Pages
import { SurvivorDashboard } from '../pages/survivor/SurvivorDashboard';
import { CreateRequestPage } from '../pages/survivor/CreateRequestPage';
import { MyRequestsPage } from '../pages/survivor/MyRequestsPage';
import { RequestDetailPage } from '../pages/survivor/RequestDetailPage';

// Volunteer Pages
import { VolunteerDashboard } from '../pages/volunteer/VolunteerDashboard';
import { NearbyRequestsPage } from '../pages/volunteer/NearbyRequestsPage';
import { VolunteerTaskPage } from '../pages/volunteer/VolunteerTaskPage';
import { VolunteerProfilePage } from '../pages/volunteer/VolunteerProfilePage';

// NGO & Resource Pages
import { NGODashboard } from '../pages/ngo/NGODashboard';
import { ResourceManagementPage } from '../pages/ngo/ResourceManagementPage';
import { ResourceAssignmentPage } from '../pages/ngo/ResourceAssignmentPage';

// Shelter Pages
import { ShelterDashboard } from '../pages/shelter/ShelterDashboard';
import { ShelterMapPage } from '../pages/shelter/ShelterMapPage';

// Admin Page
import { AdminDashboard } from '../pages/admin/AdminDashboard';

// Shared Pages
import { CentralEmergencyMapPage } from '../pages/shared/CentralEmergencyMapPage';
import { NotificationsPage } from '../pages/shared/NotificationsPage';
import { NotFoundPage } from '../pages/shared/NotFoundPage';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Authenticated Dashboard Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          {/* Shared Routes */}
          <Route path="/map" element={<CentralEmergencyMapPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />

          {/* Survivor Module (Pages 4-7) */}
          <Route element={<RoleRoute allowedRoles={['survivor']} />}>
            <Route path="/survivor" element={<SurvivorDashboard />} />
            <Route path="/survivor/request/new" element={<CreateRequestPage />} />
            <Route path="/survivor/requests" element={<MyRequestsPage />} />
            <Route path="/survivor/requests/:id" element={<RequestDetailPage />} />
          </Route>

          {/* Volunteer Module (Pages 10-13) */}
          <Route element={<RoleRoute allowedRoles={['volunteer']} />}>
            <Route path="/volunteer" element={<VolunteerDashboard />} />
            <Route path="/volunteer/nearby" element={<NearbyRequestsPage />} />
            <Route path="/volunteer/tasks/:id" element={<VolunteerTaskPage />} />
            <Route path="/volunteer/profile" element={<VolunteerProfilePage />} />
          </Route>

          {/* NGO & Resource Module (Pages 14-16) */}
          <Route element={<RoleRoute allowedRoles={['ngo', 'resource_provider']} />}>
            <Route path="/ngo" element={<NGODashboard />} />
            <Route path="/ngo/resources" element={<ResourceManagementPage />} />
            <Route path="/ngo/assignments" element={<ResourceAssignmentPage />} />
          </Route>

          {/* Shelter Module (Pages 17-18) */}
          <Route element={<RoleRoute allowedRoles={['shelter']} />}>
            <Route path="/shelter" element={<ShelterDashboard />} />
            <Route path="/shelter/map" element={<ShelterMapPage />} />
          </Route>

          {/* Admin Command Center (Page 19) */}
          <Route element={<RoleRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>
        </Route>
      </Route>

      {/* Catch-all 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
