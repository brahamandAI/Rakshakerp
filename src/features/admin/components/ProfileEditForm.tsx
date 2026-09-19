"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { updateProfileAction } from "@/features/admin/actions/admin.actions";
import { getRoleLabel } from "@/lib/auth/permissions";
import { StaffRole } from "@/types/enums";

interface ProfileEditFormProps {
  user: {
    name: string;
    email: string;
    role: StaffRole;
    department?: string;
    phone?: string;
    lastLoginAt?: string;
  };
}

export function ProfileEditForm({ user }: ProfileEditFormProps) {
  const [name, setName] = useState(user.name);
  const [department, setDepartment] = useState(user.department ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateProfileAction({
        name: name.trim(),
        department: department.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      if (result.success) {
        toast({ title: "Saved", description: "Profile updated successfully.", variant: "success" });
        router.refresh();
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    });
  }

  return (
    <Card className="h-full border-[#E2E8F0] shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Account Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user.email} disabled className="bg-[#F8FAFC]" />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Input value={getRoleLabel(user.role)} disabled className="bg-[#F8FAFC]" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Input id="department" value={department} onChange={(e) => setDepartment(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          {user.lastLoginAt && (
            <p className="text-xs text-[#64748B]">
              Last login: {new Date(user.lastLoginAt).toLocaleString("en-IN")}
            </p>
          )}
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save Profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
