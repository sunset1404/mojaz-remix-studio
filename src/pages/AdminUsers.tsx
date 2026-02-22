import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import {
  Users, Search, Plus, Shield, Eye, Edit3, Ban,
  ChevronDown, ChevronUp, Save, Trash2, UserPlus
} from "lucide-react";

const ADMIN_PAGES = [
  { key: "dashboard", label: "لوحة التحكم" },
  { key: "students", label: "طلاب الإقراء" },
  { key: "ijazah-students", label: "طلاب الإجازات" },
  { key: "reciters", label: "المقرئين" },
  { key: "partners", label: "الشركاء" },
  { key: "sessions", label: "الجلسات" },
  { key: "certificates", label: "الشهادات والإجازات" },
  { key: "achievements", label: "الإنجازات" },
  { key: "exams", label: "الاختبارات" },
  { key: "certificate-templates", label: "تصميم الشهادات" },
  { key: "plans", label: "إدارة الباقات" },
  { key: "notifications", label: "إدارة الإشعارات" },
  { key: "gifts", label: "الإهداءات" },
  { key: "rewards", label: "المكافآت والنقاط" },
  { key: "popup-messages", label: "الرسائل المنبثقة" },
  { key: "whatsapp", label: "رسائل واتساب" },
  { key: "subscriptions", label: "الاشتراكات" },
  { key: "admin-users", label: "إدارة المستخدمين" },
];

type PermissionLevel = "viewer" | "editor" | "blocked";

interface AdminUser {
  user_id: string;
  email: string;
  full_name: string;
  permissions: Record<string, PermissionLevel>;
}

const permissionLabels: Record<PermissionLevel, { label: string; icon: typeof Eye; color: string }> = {
  viewer: { label: "مشاهد", icon: Eye, color: "bg-blue-100 text-blue-700" },
  editor: { label: "محرر", icon: Edit3, color: "bg-emerald-100 text-emerald-700" },
  blocked: { label: "محجوب", icon: Ban, color: "bg-red-100 text-red-700" },
};

const AdminUsers = () => {
  const { user } = useAuth();
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [addingUser, setAddingUser] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState<string | null>(null);

  const fetchAdminUsers = async () => {
    setLoading(true);
    try {
      // Get all admin role users
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      if (rolesError) throw rolesError;
      if (!roles || roles.length === 0) {
        setAdminUsers([]);
        setLoading(false);
        return;
      }

      const userIds = roles.map((r) => r.user_id);

      // Get profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      // Get permissions
      const { data: perms } = await supabase
        .from("admin_permissions")
        .select("*")
        .in("user_id", userIds);

      const users: AdminUser[] = userIds.map((uid) => {
        const profile = profiles?.find((p) => p.user_id === uid);
        const userPerms = perms?.filter((p) => p.user_id === uid) || [];
        const permMap: Record<string, PermissionLevel> = {};
        userPerms.forEach((p) => {
          permMap[p.page_key] = p.permission_level as PermissionLevel;
        });

        return {
          user_id: uid,
          email: "",
          full_name: profile?.full_name || "مستخدم",
          permissions: permMap,
        };
      });

      setAdminUsers(users);
    } catch (err) {
      console.error(err);
      toast({ title: "خطأ", description: "فشل في تحميل المستخدمين", variant: "destructive" });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAdminUsers();
  }, []);

  const handleAddUser = async () => {
    if (!newEmail.trim()) return;
    setAddingUser(true);
    try {
      // Find user by email in profiles or student_profiles
      const { data: found } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .ilike("full_name", `%${newEmail.trim()}%`);

      // Also search by checking if the email matches (we'll search student_profiles too)
      const { data: studentFound } = await supabase
        .from("student_profiles")
        .select("user_id, full_name, email")
        .ilike("email", newEmail.trim());

      const { data: reciterFound } = await supabase
        .from("reciter_profiles")
        .select("user_id, full_name")
        .ilike("full_name", `%${newEmail.trim()}%`);

      let targetUserId: string | null = null;
      let targetName = "";

      if (studentFound && studentFound.length > 0) {
        targetUserId = studentFound[0].user_id;
        targetName = studentFound[0].full_name;
      } else if (found && found.length > 0) {
        targetUserId = found[0].user_id;
        targetName = found[0].full_name;
      } else if (reciterFound && reciterFound.length > 0) {
        targetUserId = reciterFound[0].user_id;
        targetName = reciterFound[0].full_name;
      }

      if (!targetUserId) {
        toast({ title: "لم يتم العثور على المستخدم", description: "تأكد من البريد الإلكتروني أو الاسم", variant: "destructive" });
        setAddingUser(false);
        return;
      }

      // Check if already admin
      const existing = adminUsers.find((u) => u.user_id === targetUserId);
      if (existing) {
        toast({ title: "المستخدم موجود بالفعل", variant: "destructive" });
        setAddingUser(false);
        return;
      }

      // Add admin role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ user_id: targetUserId, role: "admin" });

      if (roleError) throw roleError;

      // Set default permissions (viewer for all pages)
      const defaultPerms = ADMIN_PAGES.map((p) => ({
        user_id: targetUserId!,
        page_key: p.key,
        permission_level: "viewer" as const,
      }));

      await supabase.from("admin_permissions").insert(defaultPerms);

      toast({ title: "تمت الإضافة", description: `تم إضافة ${targetName} كمشرف` });
      setNewEmail("");
      setAddDialogOpen(false);
      fetchAdminUsers();
    } catch (err) {
      console.error(err);
      toast({ title: "خطأ", description: "فشل في إضافة المستخدم", variant: "destructive" });
    }
    setAddingUser(false);
  };

  const updatePermission = (userId: string, pageKey: string, level: PermissionLevel) => {
    setAdminUsers((prev) =>
      prev.map((u) =>
        u.user_id === userId
          ? { ...u, permissions: { ...u.permissions, [pageKey]: level } }
          : u
      )
    );
  };

  const setAllPermissions = (userId: string, level: PermissionLevel) => {
    setAdminUsers((prev) =>
      prev.map((u) => {
        if (u.user_id !== userId) return u;
        const newPerms: Record<string, PermissionLevel> = {};
        ADMIN_PAGES.forEach((p) => (newPerms[p.key] = level));
        return { ...u, permissions: newPerms };
      })
    );
  };

  const savePermissions = async (userId: string) => {
    setSavingPermissions(userId);
    try {
      const userPerms = adminUsers.find((u) => u.user_id === userId)?.permissions || {};

      // Delete existing
      await supabase.from("admin_permissions").delete().eq("user_id", userId);

      // Insert new
      const rows = Object.entries(userPerms).map(([page_key, permission_level]) => ({
        user_id: userId,
        page_key,
        permission_level,
      }));

      if (rows.length > 0) {
        const { error } = await supabase.from("admin_permissions").insert(rows);
        if (error) throw error;
      }

      toast({ title: "تم الحفظ", description: "تم تحديث الصلاحيات بنجاح" });
    } catch (err) {
      console.error(err);
      toast({ title: "خطأ", description: "فشل في حفظ الصلاحيات", variant: "destructive" });
    }
    setSavingPermissions(null);
  };

  const removeAdmin = async (userId: string) => {
    if (userId === user?.id) {
      toast({ title: "لا يمكنك إزالة نفسك", variant: "destructive" });
      return;
    }
    try {
      await supabase.from("admin_permissions").delete().eq("user_id", userId);
      await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
      toast({ title: "تمت الإزالة" });
      fetchAdminUsers();
    } catch (err) {
      console.error(err);
      toast({ title: "خطأ", variant: "destructive" });
    }
  };

  const filtered = adminUsers.filter((u) =>
    u.full_name.includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 md:p-8" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Shield className="w-7 h-7 text-primary" />
              إدارة المستخدمين
            </h1>
            <p className="text-muted-foreground text-sm mt-1">إدارة صلاحيات مستخدمي لوحة التحكم</p>
          </div>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="w-4 h-4" />
                إضافة مستخدم
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl">
              <DialogHeader>
                <DialogTitle>إضافة مستخدم جديد للوحة التحكم</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label>البريد الإلكتروني أو الاسم</Label>
                  <Input
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="أدخل البريد الإلكتروني أو اسم المستخدم"
                    className="mt-1"
                  />
                </div>
                <Button onClick={handleAddUser} disabled={addingUser} className="w-full gap-2">
                  {addingUser ? "جاري الإضافة..." : "إضافة كمشرف"}
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="w-6 h-6 text-primary mx-auto mb-1" />
              <p className="text-2xl font-bold">{adminUsers.length}</p>
              <p className="text-xs text-muted-foreground">إجمالي المشرفين</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Edit3 className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
              <p className="text-2xl font-bold">
                {adminUsers.filter((u) => Object.values(u.permissions).some((p) => p === "editor")).length}
              </p>
              <p className="text-xs text-muted-foreground">لديهم صلاحية تحرير</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Eye className="w-6 h-6 text-blue-600 mx-auto mb-1" />
              <p className="text-2xl font-bold">
                {adminUsers.filter((u) => Object.values(u.permissions).every((p) => p === "viewer")).length}
              </p>
              <p className="text-xs text-muted-foreground">مشاهدون فقط</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالاسم..."
            className="pr-10"
          />
        </div>

        {/* Users List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <span className="animate-spin w-8 h-8 border-3 border-primary border-t-transparent rounded-full" />
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>لا يوجد مشرفون</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((adminUser) => {
              const isExpanded = expandedUser === adminUser.user_id;
              const isSelf = adminUser.user_id === user?.id;
              return (
                <Card key={adminUser.user_id} className="overflow-hidden">
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedUser(isExpanded ? null : adminUser.user_id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">
                          {adminUser.full_name}
                          {isSelf && <Badge variant="outline" className="mr-2 text-[10px]">أنت</Badge>}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {Object.values(adminUser.permissions).filter((p) => p === "editor").length} صفحة تحرير
                          {" · "}
                          {Object.values(adminUser.permissions).filter((p) => p === "blocked").length} صفحة محجوبة
                        </p>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                  </div>

                  {isExpanded && (
                    <div className="border-t px-4 pb-4">
                      {/* Bulk actions */}
                      <div className="flex items-center gap-2 py-3 flex-wrap">
                        <span className="text-sm text-muted-foreground">تعيين الكل:</span>
                        {(["viewer", "editor", "blocked"] as PermissionLevel[]).map((level) => {
                          const info = permissionLabels[level];
                          return (
                            <Button
                              key={level}
                              variant="outline"
                              size="sm"
                              onClick={() => setAllPermissions(adminUser.user_id, level)}
                              className="gap-1 text-xs"
                            >
                              <info.icon className="w-3 h-3" />
                              {info.label}
                            </Button>
                          );
                        })}
                      </div>

                      <Separator className="mb-3" />

                      {/* Per-page permissions */}
                      <div className="grid gap-2">
                        {ADMIN_PAGES.map((page) => {
                          const current = adminUser.permissions[page.key] || "viewer";
                          const info = permissionLabels[current];
                          return (
                            <div key={page.key} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/30">
                              <span className="text-sm">{page.label}</span>
                              <Select
                                value={current}
                                onValueChange={(v) => updatePermission(adminUser.user_id, page.key, v as PermissionLevel)}
                              >
                                <SelectTrigger className="w-32 h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {(["viewer", "editor", "blocked"] as PermissionLevel[]).map((level) => (
                                    <SelectItem key={level} value={level}>
                                      <span className="flex items-center gap-1">
                                        {permissionLabels[level].label}
                                      </span>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex items-center gap-2 mt-4">
                        <Button
                          onClick={() => savePermissions(adminUser.user_id)}
                          disabled={savingPermissions === adminUser.user_id}
                          className="gap-2 flex-1"
                        >
                          <Save className="w-4 h-4" />
                          {savingPermissions === adminUser.user_id ? "جاري الحفظ..." : "حفظ الصلاحيات"}
                        </Button>
                        {!isSelf && (
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => removeAdmin(adminUser.user_id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
