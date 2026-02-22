import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import {
  Users, Search, Plus, Shield, Eye, Edit3, Ban,
  ChevronDown, ChevronUp, Save, Trash2, UserPlus,
  Copy, Mail, MessageCircle, Check, EyeOff, EyeIcon
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

const permissionLabels: Record<PermissionLevel, { label: string; icon: typeof Eye }> = {
  viewer: { label: "مشاهد", icon: Eye },
  editor: { label: "محرر", icon: Edit3 },
  blocked: { label: "محجوب", icon: Ban },
};

const generatePassword = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let pwd = "";
  for (let i = 0; i < 10; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
  return pwd;
};

const AdminUsers = () => {
  const { user } = useAuth();
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addingUser, setAddingUser] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState<string | null>(null);

  // New user form
  const [newFullName, setNewFullName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newPassword, setNewPassword] = useState(() => generatePassword());
  const [showPassword, setShowPassword] = useState(false);

  // Credentials sharing after creation
  const [createdCredentials, setCreatedCredentials] = useState<{ name: string; email: string; password: string } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const resetForm = () => {
    setNewFullName("");
    setNewEmail("");
    setNewPhone("");
    setNewPassword(generatePassword());
    setShowPassword(false);
    setCreatedCredentials(null);
  };

  const fetchAdminUsers = async () => {
    setLoading(true);
    try {
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

      const [{ data: profiles }, { data: perms }] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name").in("user_id", userIds),
        supabase.from("admin_permissions").select("*").in("user_id", userIds),
      ]);

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
    if (!newFullName.trim() || !newEmail.trim() || !newPassword.trim()) {
      toast({ title: "يرجى تعبئة جميع الحقول المطلوبة", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "كلمة المرور يجب أن تكون 6 أحرف على الأقل", variant: "destructive" });
      return;
    }

    setAddingUser(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-admin-user", {
        body: {
          full_name: newFullName.trim(),
          email: newEmail.trim(),
          password: newPassword,
          phone: newPhone.trim() || null,
        },
      });

      if (error) throw error;
      if (data?.error) {
        toast({ title: "خطأ", description: data.error, variant: "destructive" });
        setAddingUser(false);
        return;
      }

      // Set default permissions
      if (data?.user_id) {
        const defaultPerms = ADMIN_PAGES.map((p) => ({
          user_id: data.user_id,
          page_key: p.key,
          permission_level: "viewer" as const,
        }));
        await supabase.from("admin_permissions").insert(defaultPerms);
      }

      setCreatedCredentials({
        name: newFullName.trim(),
        email: newEmail.trim(),
        password: newPassword,
      });

      toast({ title: "تمت الإضافة بنجاح", description: `تم إنشاء حساب ${newFullName.trim()}` });
      fetchAdminUsers();
    } catch (err) {
      console.error(err);
      toast({ title: "خطأ", description: "فشل في إنشاء المستخدم", variant: "destructive" });
    }
    setAddingUser(false);
  };

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast({ title: "تم النسخ" });
  };

  const copyAllCredentials = () => {
    if (!createdCredentials) return;
    const text = `بيانات الدخول للوحة التحكم - منصة مجاز\n\nالاسم: ${createdCredentials.name}\nالبريد: ${createdCredentials.email}\nكلمة المرور: ${createdCredentials.password}\n\nرابط الدخول: ${window.location.origin}/login`;
    copyToClipboard(text, "all");
  };

  const sendViaWhatsApp = () => {
    if (!createdCredentials || !newPhone) return;
    const text = encodeURIComponent(
      `مرحباً ${createdCredentials.name} 👋\n\nتم إنشاء حسابك في لوحة تحكم منصة مجاز ✅\n\n📧 البريد: ${createdCredentials.email}\n🔑 كلمة المرور: ${createdCredentials.password}\n\n🔗 رابط الدخول:\n${window.location.origin}/login\n\nيرجى تغيير كلمة المرور بعد أول تسجيل دخول.`
    );
    const phone = newPhone.replace(/[^0-9]/g, "");
    window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
  };

  const sendViaEmail = () => {
    if (!createdCredentials) return;
    const subject = encodeURIComponent("بيانات الدخول - منصة مجاز");
    const body = encodeURIComponent(
      `مرحباً ${createdCredentials.name}\n\nتم إنشاء حسابك في لوحة تحكم منصة مجاز\n\nالبريد: ${createdCredentials.email}\nكلمة المرور: ${createdCredentials.password}\n\nرابط الدخول: ${window.location.origin}/login\n\nيرجى تغيير كلمة المرور بعد أول تسجيل دخول.`
    );
    window.open(`mailto:${createdCredentials.email}?subject=${subject}&body=${body}`, "_blank");
  };

  const updatePermission = (userId: string, pageKey: string, level: PermissionLevel) => {
    setAdminUsers((prev) =>
      prev.map((u) =>
        u.user_id === userId ? { ...u, permissions: { ...u.permissions, [pageKey]: level } } : u
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
      await supabase.from("admin_permissions").delete().eq("user_id", userId);
      const rows = Object.entries(userPerms).map(([page_key, permission_level]) => ({
        user_id: userId, page_key, permission_level,
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

  const filtered = adminUsers.filter((u) => u.full_name.includes(searchQuery));

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
          <Dialog open={addDialogOpen} onOpenChange={(open) => { setAddDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="w-4 h-4" />
                إضافة مستخدم
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl" className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{createdCredentials ? "تم إنشاء الحساب بنجاح ✅" : "إضافة مستخدم جديد"}</DialogTitle>
              </DialogHeader>

              {!createdCredentials ? (
                <div className="space-y-4 pt-2">
                  <div>
                    <Label>الاسم الكامل <span className="text-destructive">*</span></Label>
                    <Input value={newFullName} onChange={(e) => setNewFullName(e.target.value)} placeholder="مثال: أحمد محمد" className="mt-1" />
                  </div>
                  <div>
                    <Label>البريد الإلكتروني <span className="text-destructive">*</span></Label>
                    <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="example@email.com" className="mt-1" dir="ltr" />
                  </div>
                  <div>
                    <Label>رقم الجوال <span className="text-muted-foreground text-xs">(اختياري)</span></Label>
                    <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="966512345678" className="mt-1" dir="ltr" />
                  </div>
                  <div>
                    <Label>كلمة المرور <span className="text-destructive">*</span></Label>
                    <div className="relative mt-1">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="pl-16" dir="ltr"
                      />
                      <div className="absolute left-1 top-1/2 -translate-y-1/2 flex gap-1">
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <EyeIcon className="w-3.5 h-3.5" />}
                        </Button>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => setNewPassword(generatePassword())}>
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 4v6h6M23 20v-6h-6" /><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" /></svg>
                        </Button>
                      </div>
                    </div>
                  </div>
                  <Button onClick={handleAddUser} disabled={addingUser} className="w-full gap-2">
                    {addingUser ? "جاري الإنشاء..." : "إنشاء الحساب"}
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 pt-2">
                  <p className="text-sm text-muted-foreground">تم إنشاء الحساب. يمكنك مشاركة بيانات الدخول عبر الطرق التالية:</p>

                  {/* Credentials display */}
                  <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                    {[
                      { label: "الاسم", value: createdCredentials.name, key: "name" },
                      { label: "البريد", value: createdCredentials.email, key: "email" },
                      { label: "كلمة المرور", value: createdCredentials.password, key: "password" },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">{item.label}</p>
                          <p className="text-sm font-medium" dir="ltr">{item.value}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(item.value, item.key)}>
                          {copiedField === item.key ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Share buttons */}
                  <div className="grid gap-2">
                    <Button variant="outline" className="w-full gap-2 justify-center" onClick={copyAllCredentials}>
                      {copiedField === "all" ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                      نسخ جميع البيانات
                    </Button>
                    {newPhone && (
                      <Button variant="outline" className="w-full gap-2 justify-center" onClick={sendViaWhatsApp}>
                        <MessageCircle className="w-4 h-4" />
                        إرسال عبر واتساب
                      </Button>
                    )}
                    <Button variant="outline" className="w-full gap-2 justify-center" onClick={sendViaEmail}>
                      <Mail className="w-4 h-4" />
                      إرسال عبر البريد
                    </Button>
                  </div>

                  <Button className="w-full" onClick={() => { setAddDialogOpen(false); resetForm(); }}>
                    إغلاق
                  </Button>
                </div>
              )}
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
              <Edit3 className="w-6 h-6 text-primary mx-auto mb-1" />
              <p className="text-2xl font-bold">
                {adminUsers.filter((u) => Object.values(u.permissions).some((p) => p === "editor")).length}
              </p>
              <p className="text-xs text-muted-foreground">لديهم صلاحية تحرير</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Eye className="w-6 h-6 text-primary mx-auto mb-1" />
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
          <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="بحث بالاسم..." className="pr-10" />
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
                      <div className="flex items-center gap-2 py-3 flex-wrap">
                        <span className="text-sm text-muted-foreground">تعيين الكل:</span>
                        {(["viewer", "editor", "blocked"] as PermissionLevel[]).map((level) => {
                          const info = permissionLabels[level];
                          return (
                            <Button key={level} variant="outline" size="sm" onClick={() => setAllPermissions(adminUser.user_id, level)} className="gap-1 text-xs">
                              <info.icon className="w-3 h-3" />
                              {info.label}
                            </Button>
                          );
                        })}
                      </div>
                      <Separator className="mb-3" />
                      <div className="grid gap-2">
                        {ADMIN_PAGES.map((page) => {
                          const current = adminUser.permissions[page.key] || "viewer";
                          return (
                            <div key={page.key} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/30">
                              <span className="text-sm">{page.label}</span>
                              <Select value={current} onValueChange={(v) => updatePermission(adminUser.user_id, page.key, v as PermissionLevel)}>
                                <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {(["viewer", "editor", "blocked"] as PermissionLevel[]).map((level) => (
                                    <SelectItem key={level} value={level}>{permissionLabels[level].label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex items-center gap-2 mt-4">
                        <Button onClick={() => savePermissions(adminUser.user_id)} disabled={savingPermissions === adminUser.user_id} className="gap-2 flex-1">
                          <Save className="w-4 h-4" />
                          {savingPermissions === adminUser.user_id ? "جاري الحفظ..." : "حفظ الصلاحيات"}
                        </Button>
                        {!isSelf && (
                          <Button variant="destructive" size="icon" onClick={() => removeAdmin(adminUser.user_id)}>
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
