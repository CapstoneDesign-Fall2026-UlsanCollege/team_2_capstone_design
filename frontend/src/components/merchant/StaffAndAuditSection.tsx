"use client";

import React, { useCallback, useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Check,
  Lock,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import {
  AuditLogItem,
  fetchMerchantAuditLogs,
  fetchMerchantStaff,
  inviteMerchantStaff,
  MerchantStaffResponse,
  removeMerchantStaff,
  StaffMemberItem,
  updateMerchantStaffRole,
} from "@/lib/api";

interface StaffTabProps {
  storeSlug: string;
}

export function StaffPermissionsPanel({ storeSlug }: StaffTabProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MerchantStaffResponse | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  // Invite Modal State
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<"STAFF" | "OWNER">("STAFF");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const loadStaff = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchMerchantStaff(storeSlug);
      setData(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load team members.");
    } finally {
      setLoading(false);
    }
  }, [storeSlug]);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const isOwner = (data?.current_role || data?.current_user_role) === "OWNER";
  const ownersCount = (data?.members || []).filter((m) => m.role === "OWNER").length;

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);
    const cleanEmail = inviteEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setInviteError("Enter a valid staff email address.");
      return;
    }

    try {
      setInviting(true);
      await inviteMerchantStaff(storeSlug, {
        email: cleanEmail,
        full_name: inviteName.trim() || undefined,
        role: inviteRole,
      });
      setInviteOpen(false);
      setInviteEmail("");
      setInviteName("");
      setInviteRole("STAFF");
      await loadStaff();
    } catch (err: unknown) {
      setInviteError(err instanceof Error ? err.message : "Unable to add staff member.");
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (member: StaffMemberItem, nextRole: "OWNER" | "STAFF") => {
    if (member.role === nextRole) return;
    try {
      setBusyId(member.id);
      setError(null);
      await updateMerchantStaffRole(storeSlug, member.id, nextRole);
      await loadStaff();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update role.");
    } finally {
      setBusyId(null);
    }
  };

  const handleRemove = async (member: StaffMemberItem) => {
    try {
      setBusyId(member.id);
      setError(null);
      await removeMerchantStaff(storeSlug, member.id);
      await loadStaff();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to remove team member.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* RBAC Matrix Banner */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-500" />
            <h2 className="text-sm font-bold text-[var(--foreground)]">
              Staff &amp; Role-Based Access Control (RBAC)
            </h2>
          </div>
          <p className="text-xs text-[var(--muted-foreground)] max-w-xl leading-relaxed">
            <strong>Owners</strong> control encrypted Khalti keys, custom domains, and team access.{" "}
            <strong>Staff</strong> can fulfill orders, manage products, run subscriptions, and create
            promo codes strictly inside <span className="font-mono">{storeSlug}</span>.
          </p>
        </div>

        {isOwner ? (
          <button
            type="button"
            onClick={() => {
              setInviteError(null);
              setInviteOpen(true);
            }}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Staff Member</span>
          </button>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-[var(--border)] bg-[var(--secondary)] text-[11px] font-mono text-[var(--muted-foreground)] shrink-0">
            <Lock className="w-3.5 h-3.5" />
            <span>Owner permission required</span>
          </span>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-xs text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-16 rounded-lg border border-[var(--border)] bg-[var(--card)] animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden">
          {/* Mobile 375px Staff Cards */}
          <div className="sm:hidden divide-y divide-[var(--border)]">
            {(data?.members || []).map((member) => {
              const isSoleOwner = member.role === "OWNER" && ownersCount <= 1;
              return (
                <div key={member.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-[var(--secondary)] border border-[var(--border)] flex items-center justify-center font-mono text-xs font-bold text-[var(--foreground)] shrink-0">
                        {(member.full_name || member.email).slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[var(--foreground)] truncate">
                          {member.full_name} {member.is_current_user ? "(You)" : ""}
                        </p>
                        <p className="text-[11px] font-mono text-[var(--muted-foreground)] truncate">
                          {member.email}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-mono uppercase font-semibold shrink-0 ${
                        member.role === "OWNER"
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                          : "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/20"
                      }`}
                    >
                      {member.role}
                    </span>
                  </div>

                  {isOwner && !isSoleOwner && (
                    <div className="flex items-center gap-2">
                      <select
                        aria-label={`Change role for ${member.email}`}
                        disabled={busyId === member.id}
                        value={member.role}
                        onChange={(e) =>
                          handleRoleChange(member, e.target.value as "OWNER" | "STAFF")
                        }
                        className="flex-1 h-9 px-2.5 rounded-md border border-[var(--border)] bg-[var(--background)] text-xs font-mono text-[var(--foreground)]"
                      >
                        <option value="OWNER">OWNER</option>
                        <option value="STAFF">STAFF</option>
                      </select>
                      <button
                        type="button"
                        disabled={busyId === member.id}
                        onClick={() => handleRemove(member)}
                        aria-label="Remove staff member"
                        className="h-9 w-9 rounded-md border border-[var(--border)] bg-[var(--background)] text-[var(--muted-foreground)] hover:text-red-600 inline-flex items-center justify-center cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--secondary)]/50 text-[11px] font-mono uppercase text-[var(--muted-foreground)]">
                  <th className="py-2.5 px-4 font-semibold">Team Member</th>
                  <th className="py-2.5 px-4 font-semibold">Role</th>
                  <th className="py-2.5 px-4 font-semibold">Added</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Permissions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-xs">
                {(data?.members || []).map((member) => {
                  const isSoleOwner = member.role === "OWNER" && ownersCount <= 1;
                  return (
                    <tr
                      key={member.id}
                      className="hover:bg-[var(--secondary)]/30 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[var(--secondary)] border border-[var(--border)] flex items-center justify-center font-mono text-xs font-bold text-[var(--foreground)] shrink-0">
                            {(member.full_name || member.email).slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-[var(--foreground)]">
                                {member.full_name}
                              </span>
                              {member.is_current_user && (
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--secondary)] border border-[var(--border)] text-[var(--muted-foreground)]">
                                  You
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] font-mono text-[var(--muted-foreground)]">
                              {member.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-mono uppercase font-semibold ${
                            member.role === "OWNER"
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                              : "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/20"
                          }`}
                        >
                          {member.role === "OWNER" && <ShieldCheck className="w-3 h-3" />}
                          <span>{member.role}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-[var(--muted-foreground)] whitespace-nowrap">
                        {new Date(member.created_at).toLocaleDateString("en-NP", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {isOwner ? (
                          <div className="inline-flex items-center gap-2">
                            <select
                              aria-label={`Change role for ${member.email}`}
                              disabled={busyId === member.id || isSoleOwner}
                              value={member.role}
                              onChange={(e) =>
                                handleRoleChange(
                                  member,
                                  e.target.value as "OWNER" | "STAFF"
                                )
                              }
                              className="h-7 px-2 rounded border border-[var(--border)] bg-[var(--background)] text-[11px] font-mono text-[var(--foreground)] disabled:opacity-50"
                            >
                              <option value="OWNER">OWNER</option>
                              <option value="STAFF">STAFF</option>
                            </select>

                            <button
                              type="button"
                              disabled={busyId === member.id || isSoleOwner}
                              onClick={() => handleRemove(member)}
                              title={
                                isSoleOwner
                                  ? "Sole store owner cannot be removed"
                                  : "Remove member from store"
                              }
                              className="p-1.5 rounded border border-[var(--border)] bg-[var(--background)] hover:bg-red-500/10 hover:text-red-600 text-[var(--muted-foreground)] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] font-mono text-[var(--muted-foreground)]">
                            {member.role === "OWNER" ? "Full Console" : "Operations Only"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invite Staff Modal (Solid Zinc Surface) */}
      <Dialog.Root open={inviteOpen} onOpenChange={setInviteOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-2rem)] max-w-md rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xl p-5 space-y-4 outline-none">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div>
                <Dialog.Title className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Add Team Member
                </Dialog.Title>
                <Dialog.Description className="text-xs text-zinc-500 dark:text-zinc-400">
                  They sign in with Email OTP to access only /merchant/{storeSlug}
                </Dialog.Description>
              </div>
              <Dialog.Close className="p-1 rounded-md text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">
                <X className="w-4 h-4" />
              </Dialog.Close>
            </div>

            {inviteError && (
              <div className="p-2.5 rounded-md border border-red-500/30 bg-red-500/10 text-xs text-red-700 dark:text-red-300">
                {inviteError}
              </div>
            )}

            <form onSubmit={handleInvite} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                  Staff Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="staff@yourstore.com.np"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full h-9 px-3 rounded-md border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Aarav Gurung"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full h-9 px-3 rounded-md border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                  Access Level
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as "STAFF" | "OWNER")}
                  className="w-full h-9 px-2.5 rounded-md border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                >
                  <option value="STAFF">
                    STAFF — Orders, Catalog, Subscriptions &amp; Discounts
                  </option>
                  <option value="OWNER">
                    OWNER — Full Access (including Khalti Keys &amp; Staff)
                  </option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-200 dark:border-zinc-800">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="h-9 px-3.5 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                </Dialog.Close>
                <button
                  type="submit"
                  disabled={inviting}
                  className="h-9 px-4 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{inviting ? "Adding..." : "Grant Access"}</span>
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

export function AuditLogPanel({ storeSlug }: StaffTabProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [query, setQuery] = useState("");

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchMerchantAuditLogs(storeSlug);
      setLogs(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load security audit logs.");
    } finally {
      setLoading(false);
    }
  }, [storeSlug]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const filtered = logs.filter((item) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      (item.action || "").toLowerCase().includes(q) ||
      (item.actor_email || "").toLowerCase().includes(q) ||
      (item.entity_type || "").toLowerCase().includes(q) ||
      JSON.stringify(item.details || {}).toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-500" />
            <h2 className="text-sm font-bold text-[var(--foreground)]">
              Tamper-Evident Merchant Audit Trail
            </h2>
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">
            Every settings change, staff invite, order transition, and promo creation is recorded
            under Postgres RLS.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[var(--muted-foreground)] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter logs..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-8 pl-8 pr-3 rounded-md border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={loadLogs}
            title="Refresh logs"
            className="h-8 px-2.5 rounded-md border border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)] hover:bg-[var(--muted)] cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-xs text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-14 rounded-lg border border-[var(--border)] bg-[var(--card)] animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-8 text-center space-y-1">
          <Check className="w-5 h-5 text-emerald-500 mx-auto" />
          <p className="text-xs font-semibold text-[var(--foreground)]">
            No matching audit events yet
          </p>
          <p className="text-xs text-[var(--muted-foreground)]">
            Console mutations on {storeSlug} will appear here immediately.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden">
          {/* Mobile 375px Audit Log Cards */}
          <div className="sm:hidden divide-y divide-[var(--border)]">
            {filtered.map((log) => (
              <div key={log.id} className="p-3.5 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2 py-0.5 rounded border border-[var(--border)] bg-[var(--secondary)] font-mono text-[10px] font-bold text-[var(--foreground)]">
                    {log.action}
                  </span>
                  <span className="font-mono text-[10px] text-[var(--muted-foreground)] tabular-nums">
                    {new Date(log.created_at).toLocaleString("en-NP", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="font-mono text-[11px] text-[var(--foreground)] truncate">
                  {log.actor_email || "System"} · {log.entity_type} #{log.entity_id}
                </p>
                <p className="font-mono text-[10px] text-[var(--muted-foreground)] truncate">
                  {Object.entries(log.details || {})
                    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : String(v)}`)
                    .join(" · ")}
                </p>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--secondary)]/50 text-[11px] font-mono uppercase text-[var(--muted-foreground)]">
                  <th className="py-2.5 px-4 font-semibold">Timestamp</th>
                  <th className="py-2.5 px-4 font-semibold">Action</th>
                  <th className="py-2.5 px-4 font-semibold">Actor</th>
                  <th className="py-2.5 px-4 font-semibold">Resource</th>
                  <th className="py-2.5 px-4 font-semibold">Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-xs">
                {filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-[var(--secondary)]/30">
                    <td className="py-2.5 px-4 font-mono text-[11px] text-[var(--muted-foreground)] whitespace-nowrap tabular-nums">
                      {new Date(log.created_at).toLocaleString("en-NP", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded border border-[var(--border)] bg-[var(--secondary)] font-mono text-[10px] font-bold text-[var(--foreground)]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[11px] text-[var(--foreground)] whitespace-nowrap">
                      {log.actor_email || "System"}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[11px] text-[var(--muted-foreground)] whitespace-nowrap">
                      {log.entity_type} #{log.entity_id}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[11px] text-[var(--muted-foreground)] max-w-xs truncate">
                      {Object.entries(log.details || {})
                        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : String(v)}`)
                        .join(" · ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
