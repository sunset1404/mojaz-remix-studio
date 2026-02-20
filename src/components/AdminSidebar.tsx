import { 
  Users, GraduationCap, UserCheck, Clock, Award, Gift, 
  LayoutDashboard, LogOut, ChevronRight, Palette, ClipboardList, Bell, Trophy, Star, MessageSquareText, MessageCircle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import logoMojaz from "@/assets/logo-mojaz.webp";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

const mainMenuItems = [
  { title: "لوحة التحكم", icon: LayoutDashboard, id: "dashboard", path: "/" },
  { title: "طلاب الإقراء", icon: Users, id: "students", path: "/admin/students" },
  { title: "طلاب الإجازات", icon: Award, id: "ijazah-students", path: "/admin/ijazah-students" },
  { title: "المقرئين", icon: GraduationCap, id: "reciters", path: "/admin/reciters" },
  { title: "الشركاء", icon: UserCheck, id: "partners", path: "/admin/partners" },
  { title: "الجلسات", icon: Clock, id: "sessions", path: "/admin/sessions" },
  { title: "الشهادات", icon: Award, id: "certificates", path: "/admin/certificates" },
  { title: "الإهداءات", icon: Gift, id: "gifts", path: "/admin/gifts" },
  { title: "الاختبارات", icon: ClipboardList, id: "exams", path: "/admin/exams" },
];

const AdminSidebar = () => {
  const { signOut, user } = useAuth();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Sidebar side="right" collapsible="icon" className="border-l border-border/50">
      {/* Header */}
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <img 
            src={logoMojaz} 
            alt="مجاز" 
            className="h-10 w-10 rounded-xl object-cover shrink-0" 
          />
          {!isCollapsed && (
            <div className="overflow-hidden">
              <h2 className="text-base font-bold text-foreground truncate">منصة مجاز</h2>
              <p className="text-[11px] text-muted-foreground truncate">نظام إدارة إقراء القرآن</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <Separator className="mx-4 w-auto" />

      {/* Main Navigation */}
      <SidebarContent className="pt-2">
        <SidebarGroup>
          {!isCollapsed && (
            <SidebarGroupLabel className="text-xs text-muted-foreground px-4 mb-1">
              القائمة الرئيسية
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => {
                const isActive = item.path === "/" 
                  ? location.pathname === "/" 
                  : location.pathname.startsWith(item.path);
                return (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={isActive}
                    tooltip={item.title}
                    onClick={() => navigate(item.path)}
                    className={`mx-2 rounded-xl transition-all duration-200 ${
                      isActive 
                        ? "bg-primary/10 text-primary font-semibold hover:bg-primary/15" 
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isActive ? "bg-primary/15" : "bg-transparent"
                    }`}>
                      <item.icon className={`w-4 h-4 ${
                        isActive ? "text-primary" : "text-gold"
                      }`} />
                    </div>
                    <span className="truncate">{item.title}</span>
                    {isActive && !isCollapsed && (
                      <ChevronRight className="w-3 h-3 text-primary mr-auto" />
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {!isCollapsed && (
            <SidebarGroupLabel className="text-xs text-muted-foreground px-4 mb-1">
              الإعدادات
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {[
                { title: "تصميم القوالب", icon: Palette, path: "/admin/certificate-templates" },
                { title: "إدارة الإشعارات", icon: Bell, path: "/admin/notifications" },
                { title: "الإنجازات", icon: Trophy, path: "/admin/achievements" },
                { title: "المكافآت والنقاط", icon: Star, path: "/admin/rewards" },
                { title: "الرسائل المنبثقة", icon: MessageSquareText, path: "/admin/popup-messages" },
                { title: "رسائل واتساب", icon: MessageCircle, path: "/admin/whatsapp" },
              ].map((item) => {
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.title}
                      onClick={() => navigate(item.path)}
                      className={`mx-2 rounded-xl transition-all duration-200 ${
                        isActive
                          ? "bg-primary/10 text-primary font-semibold hover:bg-primary/15"
                          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isActive ? "bg-primary/15" : "bg-transparent"
                      }`}>
                        <item.icon className={`w-4 h-4 ${isActive ? "text-primary" : "text-gold"}`} />
                      </div>
                      <span className="truncate">{item.title}</span>
                      {isActive && !isCollapsed && (
                        <ChevronRight className="w-3 h-3 text-primary mr-auto" />
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <Separator className="mx-4 w-auto" />

      {/* Footer */}
      <SidebarFooter className="p-3">
        {!isCollapsed && user?.email && (
          <p className="text-[11px] text-muted-foreground truncate px-2 mb-2">
            {user.email}
          </p>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="تسجيل الخروج"
              onClick={signOut}
              className="mx-0 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
                <LogOut className="w-4 h-4" />
              </div>
              <span>تسجيل الخروج</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AdminSidebar;
