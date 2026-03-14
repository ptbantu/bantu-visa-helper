"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BellRing, Plane, Briefcase, FileText, TerminalSquare, Settings, BookOpen } from "lucide-react";
import { useLanguage } from "@/src/contexts/LanguageContext";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/src/components/ui/sidebar";

export function AppSidebar() {
  const pathname = usePathname();
  const { language, setLanguage, t } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'zh' ? 'id' : 'zh');
  };

  return (
    <Sidebar className="border-r bg-slate-50/50">
      <SidebarHeader className="h-14 flex-row items-center justify-between border-b px-4 py-0">
        <div className="flex items-center gap-2 font-semibold text-slate-900 overflow-hidden">
          <FileText className="h-5 w-5 text-blue-600 shrink-0" />
          <span className="truncate">{t('app.title')}</span>
        </div>
        <button
          onClick={toggleLanguage}
          className="flex items-center justify-center w-7 h-7 rounded-sm hover:bg-slate-200 transition-colors shrink-0 text-lg"
          title={language === 'zh' ? '切换到印尼语 (Switch to Indonesian)' : 'Beralih ke bahasa Mandarin (Switch to Chinese)'}
        >
          {language === 'zh' ? '🇨🇳' : '🇮🇩'}
        </button>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t('nav.main')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton render={<Link href="/" />} isActive={pathname === "/" || pathname === "/kitas"} tooltip={t('nav.dashboard')}>
                  <LayoutDashboard className="h-4 w-4" />
                  <span>{t('nav.dashboard')}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton render={<Link href="/reminders" />} isActive={pathname === "/reminders"} tooltip={t('nav.reminders')}>
                  <BellRing className="h-4 w-4" />
                  <span>{t('nav.reminders')}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton render={<Link href="/logs" />} isActive={pathname === "/logs"} tooltip={t('nav.logs')}>
                  <TerminalSquare className="h-4 w-4" />
                  <span>{t('nav.logs')}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton render={<Link href="/visa-dict" />} isActive={pathname === "/visa-dict"} tooltip={t('nav.visa_dict')}>
                  <BookOpen className="h-4 w-4" />
                  <span>{t('nav.visa_dict')}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton render={<Link href="/settings" />} isActive={pathname === "/settings"} tooltip={t('nav.settings')}>
                  <Settings className="h-4 w-4" />
                  <span>{t('nav.settings')}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t('nav.visa_category')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton render={<Link href="/" />} isActive={pathname === "/"} tooltip={t('nav.b211a')}>
                  <Plane className="h-4 w-4" />
                  <span>{t('nav.b211a')}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton render={<Link href="/kitas" />} isActive={pathname === "/kitas"} tooltip={t('nav.kitas')}>
                  <Briefcase className="h-4 w-4" />
                  <span>{t('nav.kitas')}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-4">
        <div className="flex flex-col gap-1 text-xs text-slate-500">
          <p>{t('footer.version')}</p>
          <p>{t('footer.sync')}</p>
          <p className="font-mono">{new Date().toISOString().split('T')[0]} 12:00</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
