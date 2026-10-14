import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { resourceAPI } from '../../api/resources';
import { requestAPI } from '../../api/requests';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { formatTimeAgo } from '../../utils/formatters';
import {
  Package,
  AlertTriangle,
  Layers,
  ArrowRight,
  PlusCircle,
  Clock,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export const NGODashboard = () => {
  const [resources, setResources] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [openRequests, setOpenRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNGOData = async () => {
      try {
        const [resList, resAlerts, reqList] = await Promise.all([
          resourceAPI.getAll({ limit: 10 }),
          resourceAPI.getAlerts(),
          requestAPI.getAll({ status: 'Submitted,Verified,Assigned,In Progress', limit: 10 }),
        ]);

        setResources(resList.data?.resources || []);
        setAlerts(resAlerts.data || []);
        setOpenRequests(reqList.data?.requests || []);
      } catch (err) {
        console.error('Failed to load NGO dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNGOData();
  }, []);

  const totalStockItems = resources.length;
  const lowStockCount = alerts.filter((a) => a.alertStatus === 'Low Stock').length;
  const expiringCount = alerts.filter((a) => a.alertStatus === 'Expiring Soon' || a.alertStatus === 'Expired').length;

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight">
            NGO & Resource Command
          </h1>
          <p className="text-xs sm:text-sm text-text-muted">
            Monitor disaster inventory, track low-stock warnings, and assign aid supplies to critical requests.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/ngo/assignments"
            className="bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-sm transition-all"
          >
            Match & Assign Supplies →
          </Link>
        </div>
      </div>

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          title="Total Resource Items"
          value={totalStockItems}
          color="primary"
          icon={Package}
          subtext="Active inventory catalog"
        />
        <StatCard
          title="Low Stock Alerts"
          value={lowStockCount}
          color="danger"
          icon={AlertTriangle}
          subtext="Under 20% capacity"
        />
        <StatCard
          title="Expiring / Expired"
          value={expiringCount}
          color="warning"
          icon={Clock}
          subtext="Check expiration dates"
        />
        <StatCard
          title="Unassigned Requests"
          value={openRequests.length}
          color="info"
          icon={Layers}
          subtext="Ready for aid allocation"
        />
      </div>

      {/* 3. Inventory Stock Alerts Banner */}
      {alerts.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-border shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-text flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              <span>Priority Inventory Alerts ({alerts.length})</span>
            </h2>
            <Link to="/ngo/resources" className="text-xs font-bold text-primary hover:underline">
              Manage Inventory →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {alerts.slice(0, 6).map((item) => (
              <div
                key={item._id}
                className="p-3.5 rounded-xl bg-slate-50 border border-border flex items-center justify-between"
              >
                <div>
                  <h4 className="text-xs font-bold text-text truncate max-w-[160px]">{item.name}</h4>
                  <span className="text-[11px] text-text-muted">
                    {item.quantity} {item.unit} remaining
                  </span>
                </div>
                <Badge
                  variant={
                    item.alertStatus === 'Expired'
                      ? 'danger'
                      : item.alertStatus === 'Expiring Soon'
                      ? 'warning'
                      : 'danger'
                  }
                >
                  {item.alertStatus}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Open Emergencies Requiring Supplies */}
      <div className="bg-white p-6 rounded-2xl border border-border shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-text">Open Emergency Requests for Allocation</h2>
          <Link to="/ngo/assignments" className="text-xs font-bold text-primary hover:underline">
            View All in Matcher →
          </Link>
        </div>

        {openRequests.length === 0 ? (
          <div className="p-8 text-center text-xs text-text-muted">
            All submitted requests have been assigned.
          </div>
        ) : (
          <div className="space-y-3">
            {openRequests.map((req) => (
              <div
                key={req._id}
                className="p-4 rounded-xl bg-slate-50/70 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge type="priority">{req.priority}</Badge>
                    <Badge type="status">{req.status}</Badge>
                  </div>
                  <h4 className="text-sm font-bold text-text">{req.category}: {req.title}</h4>
                  <p className="text-xs text-text-muted">{req.address} • {req.peopleAffected} People Affected</p>
                </div>

                <Link
                  to={`/ngo/assignments?requestId=${req._id}`}
                  className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl text-xs font-bold text-center shadow-xs"
                >
                  Match & Dispatch Supplies →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
