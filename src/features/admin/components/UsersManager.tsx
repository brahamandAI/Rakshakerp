"use client";

import { useState, useTransition } from "react";
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
import { Plus, Pencil, Trash2 } from "lucide-react";

const CREATABLE_ROLES = [
  UserRole.SUBMITTER,
  UserRole.L1,
  UserRole.L2,
  UserRole.ADMIN,
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
}

interface UsersManagerProps {
  users: StaffUserRow[];
  currentUserId: string;
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function UsersManager({ users, currentUserId }: UsersManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<CreatableRole>(UserRole.SUBMITTER);
  const [department, setDepartment] = useState("");
  const [phone, setPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  function resetForm() {
    setName(""); setEmail(""); setPassword(""); setNewPassword("");
    setRole(UserRole.SUBMITTER);
    setDepartment(""); setPhone(""); setEditingId(null); setShowForm(false);
  }

  function startEdit(user: StaffUserRow) {
    setEditingId(user._id);
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setDepartment(user.department ?? "");
    setPhone(user.phone ?? "");
    setPassword("");
    setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      if (editingId) {
        const result = await updateStaffUserAction(editingId, {
          name,
          role,
          password: newPassword || undefined,
          department: department || undefined,
          phone: phone || undefined,
        });
        if (result.success) {
          toast({ title: "Updated", description: "User updated successfully.", variant: "success" });
          resetForm();
        } else {
          toast({ title: "Error", description: result.error, variant: "destructive" });
        }
      } else {
        const result = await createStaffUserAction({
          name, email, password, role,
          department: department || undefined,
          phone: phone || undefined,
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

  function handleDelete(user: StaffUserRow) {
    if (user._id === currentUserId) {
      toast({ title: "Error", description: "Cannot delete your own account.", variant: "destructive" });
      return;
    }
    const confirmed = window.confirm(
      `Delete ${user.name} (${user.email})? This cannot be undone. Existing registrations will still show this submitter's name and email.`
    );
    if (!confirmed) return;
    startTransition(async () => {
      const result = await deleteStaffUserAction(user._id);
      if (result.success) {
        toast({ title: "Deleted", description: "User deleted successfully.", variant: "success" });
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
        <Button type="button" size="sm" onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="mr-1 h-4 w-4" /> Add User
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={!!editingId} />
            </div>
            {!editingId && (
              <div className="space-y-2"><Label>Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} /></div>
            )}
            <div className="space-y-2">
              <Label>Role</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={role}
                onChange={(e) => setRole(e.target.value as CreatableRole)}
              >
                {CREATABLE_ROLES.map((r) => (
                  <option key={r} value={r}>{getRoleLabel(r)}</option>
                ))}
              </select>
            </div>
            {editingId && (
              <div className="space-y-2"><Label>Reset Password</Label><Input type="password" minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Leave blank to keep unchanged" /></div>
            )}
            <div className="space-y-2"><Label>Department</Label><Input value={department} onChange={(e) => setDepartment(e.target.value)} /></div>
            <div className="space-y-2"><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : editingId ? "Update" : "Create"}</Button>
            <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white">
        <table className="w-full text-sm">
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
              <tr key={user._id} className="border-b border-[#E2E8F0] last:border-0">
                <td className="px-4 py-3">{user.name}</td>
                <td className="px-4 py-3 text-[#64748B]">{user.email}</td>
                <td className="px-4 py-3">{getRoleLabel(user.role)}</td>
                <td className="px-4 py-3 text-[#64748B]">{formatDate(user.lastLoginAt)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${user.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button type="button" onClick={() => startEdit(user)} className="mr-2 text-primary hover:underline">
                    <Pencil className="inline h-3.5 w-3.5" />
                  </button>
                  {user._id !== currentUserId && (
                    <>
                      <button type="button" onClick={() => toggleActive(user)} className="text-xs text-[#64748B] hover:text-primary">
                        {user.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(user)}
                        disabled={isPending}
                        className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700"
                        aria-label={`Delete ${user.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
