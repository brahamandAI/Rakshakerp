"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import {
  createStaffUserAction,
  updateStaffUserAction,
  deleteStaffUserAction,
} from "@/features/admin/actions/admin.actions";
import { getRoleLabel } from "@/lib/auth/permissions";
import { UserRole } from "@/types/enums";
import { Eye, EyeOff, Pencil, Plus, Trash2, UserRound, X } from "lucide-react";

const CREATABLE_ROLES = [
  UserRole.SUBMITTER,
  UserRole.L1,
  UserRole.L2,
  UserRole.SCANNING,
  UserRole.ADMIN,
  UserRole.PAYROLL_MANAGER,
  UserRole.PAYROLL_EXECUTIVE,
] as const;

type CreatableRole = (typeof CREATABLE_ROLES)[number];

export interface StaffUserRow {
  _id: string;
  name: string;
  email: string;
  role: CreatableRole;
  department?: string;
  phone?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  assignedPayrollManagerId?: string;
  assignedPayrollManagerName?: string;
}

interface PayrollManagerOption {
  id: string;
  name: string;
}

interface UsersManagerProps {
  users: StaffUserRow[];
  currentUserId: string;
  payrollManagers: PayrollManagerOption[];
}

const actionBtnClass =
  "h-8 w-full px-2 text-[11px] font-semibold hover:translate-y-0 active:translate-y-0";

function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function PasswordField({
  label,
  value,
  onChange,
  required,
  minLength,
  placeholder,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  minLength?: number;
  placeholder?: string;
  autoComplete?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <Input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          minLength={minLength}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="pr-11"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[#64748B] transition hover:bg-[#E2E8F0]/70 hover:text-[#0B1F3A]"
          aria-label={visible ? "Hide password" : "Show password"}
          tabIndex={-1}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function UserActions({
  user,
  isCurrentUser,
  disabled,
  onEdit,
  onToggleActive,
  onDelete,
}: {
  user: StaffUserRow;
  isCurrentUser: boolean;
  disabled: boolean;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="grid w-full grid-cols-3 gap-1.5 md:ml-auto md:w-[18.5rem]">
      <Button
        type="button"
        size="sm"
        variant="sky"
        className={actionBtnClass}
        onClick={onEdit}
      >
        <Pencil className="h-3.5 w-3.5" />
        Edit
      </Button>
      {isCurrentUser ? (
        <div className="col-span-2 flex h-8 items-center justify-center rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold text-[#64748B]">
          Your account
        </div>
      ) : (
        <>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className={actionBtnClass}
            onClick={onToggleActive}
            disabled={disabled}
          >
            {user.isActive ? "Deactivate" : "Activate"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            className={actionBtnClass}
            onClick={onDelete}
            disabled={disabled}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        </>
      )}
    </div>
  );
}

export function UsersManager({
  users,
  currentUserId,
  payrollManagers,
}: UsersManagerProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<CreatableRole>(UserRole.SUBMITTER);
  const [department, setDepartment] = useState("");
  const [phone, setPhone] = useState("");
  const [assignedPayrollManagerId, setAssignedPayrollManagerId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<StaffUserRow | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const editingSelf = editingId === currentUserId;

  function resetForm() {
    setName(""); setEmail(""); setPassword(""); setNewPassword("");
    setRole(UserRole.SUBMITTER);
    setDepartment(""); setPhone(""); setAssignedPayrollManagerId("");
    setEditingId(null); setShowForm(false);
  }

  function startEdit(user: StaffUserRow) {
    setEditingId(user._id);
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setDepartment(user.department ?? "");
    setPhone(user.phone ?? "");
    setAssignedPayrollManagerId(user.assignedPayrollManagerId ?? "");
    setPassword("");
    setNewPassword("");
    setShowForm(true);
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      if (editingId) {
        if (role === UserRole.PAYROLL_EXECUTIVE && !assignedPayrollManagerId) {
          toast({
            title: "Payroll Manager required",
            description: "Select the Payroll Manager this executive is assigned to.",
            variant: "destructive",
          });
          return;
        }
        const result = await updateStaffUserAction(editingId, {
          name: name.trim(),
          role: editingSelf ? undefined : role,
          password: newPassword || undefined,
          department: department.trim(),
          phone: phone.trim(),
          ...(role === UserRole.PAYROLL_EXECUTIVE
            ? { assignedPayrollManagerId }
            : {}),
        });
        if (result.success) {
          toast({ title: "Updated", description: "User updated successfully.", variant: "success" });
          resetForm();
        } else {
          toast({ title: "Error", description: result.error, variant: "destructive" });
        }
      } else {
        if (role === UserRole.PAYROLL_EXECUTIVE && !assignedPayrollManagerId) {
          toast({
            title: "Payroll Manager required",
            description: "Select the Payroll Manager this executive is assigned to.",
            variant: "destructive",
          });
          return;
        }
        const result = await createStaffUserAction({
          name, email, password, role,
          department: department || undefined,
          phone: phone || undefined,
          ...(role === UserRole.PAYROLL_EXECUTIVE
            ? { assignedPayrollManagerId }
            : {}),
        });
        if (result.success) {
          toast({ title: "Created", description: "Staff user created.", variant: "success" });
          resetForm();
        } else {
          toast({ title: "Error", description: result.error, variant: "destructive" });
        }
      }
    });
  }

  function confirmDelete(user: StaffUserRow) {
    if (user._id === currentUserId) {
      toast({ title: "Error", description: "Cannot delete your own account.", variant: "destructive" });
      return;
    }
    setDeleteTarget(user);
  }

  function handleDelete() {
    if (!deleteTarget) return;
    const user = deleteTarget;
    startTransition(async () => {
      const result = await deleteStaffUserAction(user._id);
      if (result.success) {
        toast({ title: "Deleted", description: "User deleted successfully.", variant: "success" });
        setDeleteTarget(null);
        if (editingId === user._id) resetForm();
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    });
  }

  function toggleActive(user: StaffUserRow) {
    if (user._id === currentUserId) {
      toast({ title: "Error", description: "Cannot deactivate your own account.", variant: "destructive" });
      return;
    }
    startTransition(async () => {
      const result = await updateStaffUserAction(user._id, { isActive: !user.isActive });
      if (result.success) {
        toast({ title: "Updated", description: "User status changed.", variant: "success" });
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="h-4 w-4" /> Add User
        </Button>
      </div>

      {showForm && (
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                {editingId ? "Edit staff account" : "New staff account"}
              </p>
              <h3 className="mt-1 font-heading text-lg font-semibold text-primary">
                {editingId ? "Update user details" : "Create a user"}
              </h3>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={resetForm} aria-label="Close form">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={!!editingId} />
            </div>
            {!editingId && (
              <PasswordField
                label="Password"
                value={password}
                onChange={setPassword}
                required
                minLength={8}
                autoComplete="new-password"
              />
            )}
            <div className="space-y-2">
              <Label>Role</Label>
              <select
                className="flex h-11 w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 text-sm disabled:cursor-not-allowed disabled:bg-[#F8FAFC] disabled:opacity-60"
                value={role}
                onChange={(e) => {
                  const nextRole = e.target.value as CreatableRole;
                  setRole(nextRole);
                  if (nextRole !== UserRole.PAYROLL_EXECUTIVE) {
                    setAssignedPayrollManagerId("");
                  }
                }}
                disabled={editingSelf}
              >
                {CREATABLE_ROLES.map((r) => (
                  <option key={r} value={r}>{getRoleLabel(r)}</option>
                ))}
              </select>
              {editingSelf && (
                <p className="text-xs text-[#64748B]">You cannot change your own role.</p>
              )}
            </div>
            {editingId && (
              <PasswordField
                label="Reset Password"
                value={newPassword}
                onChange={setNewPassword}
                minLength={8}
                placeholder="Leave blank to keep unchanged"
                autoComplete="new-password"
              />
            )}
            {role === UserRole.PAYROLL_EXECUTIVE && (
              <div className="space-y-2 sm:col-span-2">
                <Label>Assigned To</Label>
                <select
                  className="flex h-11 w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 text-sm"
                  value={assignedPayrollManagerId}
                  onChange={(e) => setAssignedPayrollManagerId(e.target.value)}
                  required
                >
                  <option value="">Select Payroll Manager</option>
                  {payrollManagers.map((manager) => (
                    <option key={manager.id} value={manager.id}>
                      {manager.name}
                    </option>
                  ))}
                </select>
                {payrollManagers.length === 0 && (
                  <p className="text-xs text-[#B45309]">
                    Create a Payroll Manager before assigning a Payroll Executive.
                  </p>
                )}
              </div>
            )}
            <div className="space-y-2"><Label>Department</Label><Input value={department} onChange={(e) => setDepartment(e.target.value)} /></div>
            <div className="space-y-2"><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button type="submit" disabled={isPending}>{isPending ? "Saving…" : editingId ? "Save changes" : "Create user"}</Button>
            <Button type="button" variant="secondary" onClick={resetForm}>Cancel</Button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
        <table className="hidden w-full text-sm md:table">
          <thead>
            <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
              <th className="px-4 py-3 text-left font-medium text-[#64748B]">Name</th>
              <th className="px-4 py-3 text-left font-medium text-[#64748B]">Email</th>
              <th className="px-4 py-3 text-left font-medium text-[#64748B]">Role</th>
              <th className="px-4 py-3 text-left font-medium text-[#64748B]">Last Login</th>
              <th className="px-4 py-3 text-left font-medium text-[#64748B]">Status</th>
              <th className="px-4 py-3 text-right font-medium text-[#64748B]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-[#64748B]">No staff users found.</td></tr>
            ) : users.map((user) => (
              <tr key={user._id} className="border-b border-[#E2E8F0] last:border-0 hover:bg-[#F8FAFC]">
                <td className="px-4 py-3 font-medium text-primary">
                  {user.name}
                  {user._id === currentUserId && (
                    <span className="ml-2 inline-flex rounded-full bg-[#EFF6FF] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#1D4ED8]">
                      You
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-[#64748B]">{user.email}</td>
                <td className="px-4 py-3">
                  <div>{getRoleLabel(user.role)}</div>
                  {user.assignedPayrollManagerName && (
                    <div className="text-xs text-[#64748B]">
                      Assigned to {user.assignedPayrollManagerName}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-[#64748B]">{formatDate(user.lastLoginAt)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${user.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <UserActions
                    user={user}
                    isCurrentUser={user._id === currentUserId}
                    disabled={isPending}
                    onEdit={() => startEdit(user)}
                    onToggleActive={() => toggleActive(user)}
                    onDelete={() => confirmDelete(user)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="space-y-3 p-3 md:hidden">
          {users.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-[#64748B]">No staff users found.</p>
          ) : users.map((user) => (
            <article key={user._id} className="rounded-xl border border-[#E2E8F0] p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#1D4ED8]">
                  <UserRound className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-heading font-semibold text-primary">
                    {user.name}
                    {user._id === currentUserId && (
                      <span className="ml-2 inline-flex rounded-full bg-[#EFF6FF] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#1D4ED8]">
                        You
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-[#64748B]">{user.email}</p>
                  <p className="mt-1 text-sm text-[#334155]">{getRoleLabel(user.role)}</p>
                  {user.assignedPayrollManagerName && (
                    <p className="text-xs text-[#64748B]">
                      Assigned to {user.assignedPayrollManagerName}
                    </p>
                  )}
                </div>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${user.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                  {user.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="mt-3">
                <UserActions
                  user={user}
                  isCurrentUser={user._id === currentUserId}
                  disabled={isPending}
                  onEdit={() => startEdit(user)}
                  onToggleActive={() => toggleActive(user)}
                  onDelete={() => confirmDelete(user)}
                />
              </div>
            </article>
          ))}
        </div>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1F3A]/45 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="font-heading text-lg font-semibold text-primary">Delete user?</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#64748B]">
              Delete <span className="font-semibold text-primary">{deleteTarget.name}</span> ({deleteTarget.email})?
              This cannot be undone. Existing registrations will still show this submitter&apos;s name and email.
            </p>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={isPending}>
                {isPending ? "Deleting…" : "Delete user"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
