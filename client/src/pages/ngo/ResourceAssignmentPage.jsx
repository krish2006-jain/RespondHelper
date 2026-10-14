import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { requestAPI } from '../../api/requests';
import { resourceAPI } from '../../api/resources';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { formatDistance, formatTimeAgo } from '../../utils/formatters';
import {
  Layers,
  CheckCircle2,
  Package,
  MapPin,
  Sparkles,
  AlertCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';

export const ResourceAssignmentPage = () => {
  const queryParamReqId = new URLSearchParams(useLocation().search).get('requestId');

  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [matchData, setMatchData] = useState(null);
  const [allResources, setAllResources] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [assigningId, setAssigningId] = useState(null);

  const fetchOpenRequests = async () => {
    try {
      const [reqsRes, resListRes] = await Promise.all([
        requestAPI.getAll({ status: 'Submitted,Verified,Assigned,In Progress' }),
        resourceAPI.getAll({ limit: 50 }),
      ]);

      const list = reqsRes.data?.requests || [];
      setRequests(list);
      setAllResources(resListRes.data?.resources || []);

      if (list.length > 0) {
        const target = queryParamReqId ? list.find((r) => r._id === queryParamReqId) || list[0] : list[0];
        setSelectedRequest(target);
      }
    } catch (err) {
      console.error('Failed to load requests & inventory:', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    fetchOpenRequests();
  }, [queryParamReqId]);

  useEffect(() => {
    if (!selectedRequest?._id) return;

    const fetchMatches = async () => {
      setLoadingMatches(true);
      try {
        const res = await requestAPI.getMatches(selectedRequest._id);
        setMatchData(res.data);
      } catch (err) {
        console.error('Failed to calculate matches:', err);
      } finally {
        setLoadingMatches(false);
      }
    };

    fetchMatches();
  }, [selectedRequest]);

  const handleAssignResource = async (resourceMatchOrItem) => {
    const resObj = resourceMatchOrItem.resource || resourceMatchOrItem;
    const qty = window.prompt(
      `Enter quantity of ${resObj.name} to dispatch (Available: ${resObj.quantity} ${resObj.unit}):`,
      selectedRequest.peopleAffected || 10
    );

    if (!qty || isNaN(qty) || Number(qty) <= 0) return;

    setAssigningId(resObj._id);
    try {
      await resourceAPI.assign(resObj._id, {
        requestId: selectedRequest._id,
        quantityToAllocate: Number(qty),
      });

      alert(`✅ Dispatched ${qty} ${resObj.unit} to ${selectedRequest.title || selectedRequest.category}!`);
      // Refresh requests list & resources
      fetchOpenRequests();
    } catch (err) {
      alert(err.message || 'Failed to assign resource');
    } finally {
      setAssigningId(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-text tracking-tight">Intelligent Resource Assignment</h1>
        <p className="text-xs sm:text-sm text-text-muted">
          Our recommendation algorithm scores warehouses by Urgency, Proximity, Stock Sufficiency, and Expiry.
        </p>
      </div>

      {loadingRequests ? (
        <div className="bg-white p-12 rounded-2xl border border-border text-center text-text-muted text-sm">
          Loading unassigned emergency requests...
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-border text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-success mx-auto" />
          <h3 className="text-base font-bold text-text">All emergency requests are fulfilled</h3>
          <p className="text-xs text-text-muted max-w-sm mx-auto">
            There are no pending emergency supply allocations at this moment.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Requests Queue Picker */}
          <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-border shadow-card space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-text-muted flex items-center justify-between">
              <span>Unassigned Requests</span>
              <span className="text-xs font-bold text-primary">{requests.length} open</span>
            </h3>

            <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
              {requests.map((req) => {
                const isSelected = selectedRequest?._id === req._id;
                return (
                  <div
                    key={req._id}
                    onClick={() => setSelectedRequest(req)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary bg-primary-subtle/30 shadow-xs'
                        : 'border-border hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Badge type="priority">{req.priority}</Badge>
                      <span className="text-[11px] text-text-muted">{formatTimeAgo(req.createdAt)}</span>
                    </div>
                    <h4 className="text-sm font-bold text-text">{req.category}: {req.title}</h4>
                    <p className="text-xs text-text-muted mt-0.5 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-primary" />
                      <span className="truncate">{req.address}</span>
                    </p>
                    <span className="inline-block mt-2 text-[11px] font-semibold text-text bg-slate-100 px-2 py-0.5 rounded">
                      Needs: ~{req.peopleAffected} units
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Ranked Resource Matches */}
          <div className="lg:col-span-7 space-y-4">
            {selectedRequest && (
              <div className="bg-white p-6 rounded-2xl border border-border shadow-card space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div>
                    <span className="text-xs font-bold uppercase text-text-muted">Target Request</span>
                    <h2 className="text-lg font-bold text-text">{selectedRequest.title || selectedRequest.category}</h2>
                  </div>
                  <Badge type="priority">{selectedRequest.priority}</Badge>
                </div>

                <div className="text-xs text-text-muted space-y-1">
                  <p><strong>Category:</strong> {selectedRequest.category}</p>
                  <p><strong>Required Quantity:</strong> ~{selectedRequest.peopleAffected} units</p>
                  <p><strong>Location:</strong> {selectedRequest.address}</p>
                </div>

                {/* Ranked Matches List */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-accent" />
                    <span>Ranked Warehouse Recommendations</span>
                  </h3>

                  {loadingMatches ? (
                    <div className="p-8 text-center text-xs text-text-muted">Calculating optimal supplies...</div>
                  ) : matchData?.recommendedResources?.length === 0 ? (
                    <div className="p-6 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                      No stock matches available within range for category "{selectedRequest.category}".
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {matchData?.recommendedResources?.map((match, idx) => {
                        const res = match.resource;
                        return (
                          <div
                            key={res._id}
                            className={`p-4 sm:p-5 rounded-2xl border-2 transition-all space-y-3 ${
                              match.isBestMatch
                                ? 'border-primary bg-primary-subtle/20 shadow-md ring-2 ring-primary/20'
                                : 'border-border bg-white hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  {match.isBestMatch && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-primary text-white uppercase">
                                      ★ Best Match
                                    </span>
                                  )}
                                  <span className="text-xs font-bold text-text-muted">
                                    Score: {match.score * 100}%
                                  </span>
                                </div>
                                <h4 className="text-base font-bold text-text">{res.name}</h4>
                                <p className="text-xs font-semibold text-primary mt-0.5">
                                  {match.matchReason}
                                </p>
                              </div>

                              <div className="text-right">
                                <span className="text-xs text-text-muted block">Available Stock</span>
                                <span className="text-base font-extrabold text-text">
                                  {res.quantity} {res.unit}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-border/80">
                              <span className="text-[11px] text-text-muted">
                                {res.address}
                              </span>

                              <Button
                                variant={match.isBestMatch ? 'primary' : 'secondary'}
                                size="sm"
                                onClick={() => handleAssignResource(match)}
                                isLoading={assigningId === res._id}
                                className="font-bold text-xs"
                              >
                                Allocate & Dispatch →
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Direct Warehouse Inventory Dispatch */}
                <div className="pt-4 border-t border-border space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-primary" />
                      All Warehouse Stock ({allResources.length} Items Available)
                    </span>
                  </h3>

                  {allResources.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-border text-xs text-text-muted text-center">
                      No stock items found in warehouse inventory. Go to "Manage Supplies" to add stock.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {allResources.map((res) => {
                        const isAssigning = assigningId === res._id;
                        return (
                          <div
                            key={res._id}
                            className="p-3 rounded-xl border border-border bg-white hover:bg-slate-50 transition-colors flex items-center justify-between gap-3"
                          >
                            <div className="space-y-0.5 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-bold text-text truncate">{res.name}</h4>
                                <span className="text-[10px] font-semibold bg-slate-100 text-text-muted px-1.5 py-0.2 rounded">
                                  {res.category}
                                </span>
                              </div>
                              <p className="text-[11px] text-text-muted">
                                Available: <strong className="text-text">{res.quantity} {res.unit}</strong> • {res.address}
                              </p>
                            </div>

                            <Button
                              size="sm"
                              variant="primary"
                              disabled={isAssigning || res.quantity <= 0}
                              onClick={() => handleAssignResource(res)}
                              className="text-xs font-bold whitespace-nowrap"
                            >
                              {isAssigning ? 'Dispatching...' : 'Dispatch to SOS →'}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
