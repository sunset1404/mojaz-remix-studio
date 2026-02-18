import { 
  Users, GraduationCap, UserCheck, Clock, Award, Gift, 
  LayoutDashboard, Settings, LogOut, ChevronRight
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
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
  { title: "لوحة التحكم", icon: LayoutDashboard, id: "dashboard", active: true },
  { title: "الطلاب", icon: Users, id: "students" },
  { title: "المقرئين", icon: GraduationCap, id: "reciters" },
  { title: "الشركاء", icon: UserCheck, id: "partners" },
  { title: "الجلسات", icon: Clock, id: "sessions" },
  { title: "الشهادات", icon: Award, id: "certificates" },
  { title: "الإهداءات", icon: Gift, id: "gifts" },
];

const AdminSidebar = () => {
  const { signOut, user } = useAuth();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

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
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={item.active}
                    tooltip={item.title}
                    className={`mx-2 rounded-xl transition-all duration-200 ${
                      item.active 
                        ? "bg-primary/10 text-primary font-semibold hover:bg-primary/15" 
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      item.active ? "bg-primary/15" : "bg-transparent"
                    }`}>
                      <item.icon className={`w-4 h-4 ${
                        item.active ? "text-primary" : "text-gold"
                      }`} />
                    </div>
                    <span className="truncate">{item.title}</span>
                    {item.active && !isCollapsed && (
                      <ChevronRight className="w-3 h-3 text-primary mr-auto" />
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
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
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="الإعدادات"
                  className="mx-2 rounded-xl text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
                    <Settings className="w-4 h-4 text-gold" />
                  </div>
                  <span>الإعدادات</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
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
