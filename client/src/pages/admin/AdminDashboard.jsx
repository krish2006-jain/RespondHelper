import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { adminAPI } from '../../api/admin';
import { requestAPI } from '../../api/requests';
import { mapAPI } from '../../api/map';
import { volunteerAPI } from '../../api/volunteers';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { MapView } from '../../components/map/MapView';
import { formatDateTime, formatTimeAgo } from '../../utils/formatters';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  ShieldAlert,
  Users,
  CheckCircle2,
  AlertTriangle,
  Home,
  Package,
  Layers,
  BarChart3,
  ShieldCheck,
  UserCheck,
  UserX,
  RefreshCw,
  Search,
  ExternalLink,
} from 'lucide-react';

const PIE_COLORS = ['#C8352B', '#E27D26', '#E8A33D', '#2F8F5B', '#2B6CB0', '#6B4FA0', '#5B6770'];

export const AdminDashboard = () => {
  const queryTab = new URLSearchParams(useLocation().search).get('tab');
  const [activeTab, setActiveTab] = useState(queryTab || 'overview'); // 'overview' | 'verifications' | 'users' | 'requests' | 'analytics'

  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [mapEntities, setMapEntities] = useState({});
  const [verificationDocs, setVerificationDocs] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters in Users tab
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');

  const loadAdminData = async () => {
    try {
      const [statsRes, analyticsRes, mapRes, verifRes, usersRes, reqRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getAnalytics(),
        mapAPI.getEntities({ radiusKm: 50 }),
        adminAPI.getVerificationQueue(),
        adminAPI.getUsers({ limit: 50 }),
        requestAPI.getAll({ limit: 50 }),
      ]);

      setStats(statsRes.data);
      setAnalytics(analyticsRes.data);
      setMapEntities(mapRes.data || {});
      setVerificationDocs(verifRes.data?.documents || []);
      setPendingUsers(verifRes.data?.pendingUsers || []);
      setAllUsers(usersRes.data?.users || []);
      setRequests(reqRes.data?.requests || []);
    } catch (err) {
      console.error('Failed to load admin command center data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  useEffect(() => {
    if (queryTab) setActiveTab(queryTab);
  }, [queryTab]);

  const handleReviewUser = async (userId, status, docId = null) => {
    const reason = status === 'rejected' ? window.prompt('Enter rejection reason:') || 'Incomplete verification document.' : '';
    try {
      await adminAPI.reviewVerification(userId, { status, rejectionReason: reason, documentId: docId });
      alert(`User verification status updated to ${status}`);
      loadAdminData();
    } catch (err) {
      alert(err.message || 'Failed to review verification');
    }
  };

  const handleToggleBlock = async (userId) => {
    if (!window.confirm('Are you sure you want to change this user account access state?')) return;
    try {
      await adminAPI.toggleBlockUser(userId);
      loadAdminData();
    } catch (err) {
      alert(err.message || 'Failed to change user block state');
    }
  };

  const handleManualReassign = async (requestId) => {
    const responderId = window.prompt('Enter Responder User ID to assign to:');
    if (!responderId) return;
    try {
      await adminAPI.reassignRequest(requestId, responderId);
      alert('Request reassigned successfully');
      loadAdminData();
    } catch (err) {
      alert(err.message || 'Failed to reassign');
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* 1. Header Bar */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-border shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-danger animate-ping" />
            <span className="text-xs font-bold uppercase tracking-wider text-danger">
              Live National Command Center
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight">
            Disaster Management & Operations
          </h1>
          <p className="text-xs sm:text-sm text-text-muted">
            Full-spectrum control: User verification, resource dispatch, responder tracking, and disaster analytics.
          </p>
        </div>

        <Button variant="secondary" onClick={loadAdminData} className="font-bold text-xs">
          <RefreshCw className="w-4 h-4 mr-1.5" /> Refresh Network Data
        </Button>
      </div>

      {/* 2. 8 KPI Strip as required in req.md 3.10 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Active Emergencies"
          value={stats?.activeEmergencies ?? 0}
          color="danger"
          icon={AlertTriangle}
        />
        <StatCard
          title="Critical SOS Alerts"
          value={stats?.criticalRequests ?? 0}
          color="danger"
          icon={ShieldAlert}
        />
        <StatCard
          title="Active Volunteers"
          value={stats?.activeVolunteers ?? 0}
          color="success"
          icon={Users}
        />
        <StatCard
          title="Verified NGOs"
          value={stats?.verifiedNGOs ?? 0}
          color="info"
          icon={ShieldCheck}
        />
        <StatCard
          title="Available Shelters"
          value={stats?.availableShelters ?? 0}
          color="shelter"
          icon={Home}
        />
        <StatCard
          title="Supplies in Stock"
          value={stats?.availableResources ?? 0}
          color="primary"
          icon={Package}
        />
        <StatCard
          title="Pending Requests"
          value={stats?.pendingRequests ?? 0}
          color="warning"
          icon={Layers}
        />
        <StatCard
          title="Resolved Emergencies"
          value={stats?.resolvedRequests ?? 0}
          color="success"
          icon={CheckCircle2}
        />
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex gap-2 border-b border-border pb-3 overflow-x-auto">
        {[
          { id: 'overview', label: 'Operations & Live Map', icon: Layers },
          { id: 'verifications', label: `Verification Queue (${pendingUsers.length})`, icon: ShieldCheck },
          { id: 'users', label: 'User Directory', icon: Users },
          { id: 'requests', label: 'Requests & Reassign', icon: AlertTriangle },
          { id: 'analytics', label: 'Disaster Analytics', icon: BarChart3 },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-white text-text-muted hover:bg-slate-100 hover:text-text border border-border'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Overview & Live Central Map */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-2xl border border-border shadow-card space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-text">
              Live Regional Operational Grid (Mumbai Metropolitan)
            </h3>
            <MapView entities={mapEntities} height="480px" zoom={11} />
          </div>
        </div>
      )}

      {/* TAB 2: Verification Queue */}
      {activeTab === 'verifications' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-border shadow-card space-y-4">
            <h2 className="text-base font-extrabold text-text">
              Pending Responder Identity Approvals ({pendingUsers.length})
            </h2>

            {pendingUsers.length === 0 ? (
              <div className="p-12 text-center text-xs text-text-muted">
                No responders awaiting verification. All registrations have been processed.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingUsers.map((pUser) => (
                  <div
                    key={pUser._id}
                    className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-text">{pUser.name}</span>
                        <span className="text-[10px] uppercase font-bold text-primary bg-primary-subtle px-2 py-0.5 rounded">
                          {pUser.role}
                        </span>
                        <Badge variant="warning">{pUser.verificationStatus}</Badge>
                      </div>
                      <p className="text-xs text-text-muted">
                        {pUser.email} • {pUser.phone} • {pUser.address}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReviewUser(pUser._id, 'rejected')}
                        className="text-danger border-danger/30 text-xs"
                      >
                        <UserX className="w-3.5 h-3.5 mr-1" /> Reject
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleReviewUser(pUser._id, 'verified')}
                        className="text-xs font-bold bg-success hover:bg-success-dark"
                      >
                        <UserCheck className="w-3.5 h-3.5 mr-1" /> Approve & Verify
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: User Directory */}
      {activeTab === 'users' && (
        <div className="bg-white p-6 rounded-2xl border border-border shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search user by name, email, phone..."
              className="flex-1 px-4 py-2 rounded-xl border border-border text-xs sm:text-sm"
            />
            <select
              value={userRoleFilter}
              onChange={(e) => setUserRoleFilter(e.target.value)}
              className="px-4 py-2 rounded-xl border border-border text-xs sm:text-sm bg-white font-semibold"
            >
              <option value="">All Roles</option>
              <option value="survivor">Survivor</option>
              <option value="volunteer">Volunteer</option>
              <option value="ngo">NGO</option>
              <option value="shelter">Shelter</option>
              <option value="resource_provider">Provider</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-border font-bold uppercase text-text-muted text-[10px]">
                <tr>
                  <th className="p-3">User Name & Contact</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Verification</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Access Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {allUsers
                  .filter((u) => (!userRoleFilter || u.role === userRoleFilter) && (!userSearch || u.name.toLowerCase().includes(userSearch.toLowerCase())))
                  .map((u) => (
                    <tr key={u._id} className="hover:bg-slate-50">
                      <td className="p-3">
                        <div className="font-bold text-text">{u.name}</div>
                        <span className="text-text-muted">{u.email} • {u.phone}</span>
                      </td>
                      <td className="p-3 uppercase font-bold text-primary">{u.role}</td>
                      <td className="p-3">
                        <Badge variant={u.verificationStatus === 'verified' ? 'success' : 'warning'}>
                          {u.verificationStatus}
                        </Badge>
                      </td>
                      <td className="p-3">
                        {u.isBlocked ? (
                          <span className="text-danger font-bold">Suspended</span>
                        ) : (
                          <span className="text-success font-bold">Active</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleToggleBlock(u._id)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${
                              u.isBlocked
                                ? 'bg-success-light text-success border-success/30 hover:bg-success hover:text-white'
                                : 'bg-danger-light text-danger border-danger/30 hover:bg-danger hover:text-white'
                            }`}
                          >
                            {u.isBlocked ? 'Unblock' : 'Suspend'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Request Reassignment */}
      {activeTab === 'requests' && (
        <div className="bg-white p-6 rounded-2xl border border-border shadow-card space-y-4">
          <h2 className="text-base font-extrabold text-text">Live Emergency Requests Management</h2>
          <div className="space-y-3">
            {requests.map((r) => (
              <div
                key={r._id}
                className="p-4 rounded-xl bg-slate-50 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge type="priority">{r.priority}</Badge>
                    <Badge type="status">{r.status}</Badge>
                  </div>
                  <h4 className="text-sm font-bold text-text">{r.category}: {r.title}</h4>
                  <p className="text-xs text-text-muted">{r.address} • Survivor: {r.survivorId?.name} ({r.survivorId?.phone})</p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleManualReassign(r._id)}
                    className="text-xs font-bold"
                  >
                    Reassign Dispatch →
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: Disaster Intelligence & Recharts Analytics */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Chart 1: Requests by Category */}
            <div className="bg-white p-6 rounded-2xl border border-border shadow-card space-y-4">
              <h3 className="text-sm font-bold uppercase text-text-muted">
                Emergencies by Aid Category
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.categories || []}>
                    <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0F5C5C" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Requests by Priority */}
            <div className="bg-white p-6 rounded-2xl border border-border shadow-card space-y-4">
              <h3 className="text-sm font-bold uppercase text-text-muted">
                Crisis Urgency Breakdown
              </h3>
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.priorities || []}
                      dataKey="count"
                      nameKey="priority"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {(analytics.priorities || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Shelter Occupancy Stat */}
          <div className="bg-white p-6 rounded-2xl border border-border shadow-card space-y-2">
            <h3 className="text-sm font-bold uppercase text-text-muted">
              Aggregate Shelter Occupancy Across Mumbai
            </h3>
            <div className="flex justify-between text-xs font-bold text-text-muted">
              <span>Occupied: {analytics.shelterOccupancy?.totalOccupied || 0} Beds</span>
              <span className="text-success">Vacant: {analytics.shelterOccupancy?.vacant || 0} Beds</span>
              <span>Total Capacity: {analytics.shelterOccupancy?.totalCapacity || 0}</span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-shelter transition-all"
                style={{ width: `${analytics.shelterOccupancy?.occupancyRate || 0}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
