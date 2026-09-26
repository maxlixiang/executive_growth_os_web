import {
  BookOpen,
  CircleHelp,
  GraduationCap,
  History,
  Home,
  NotebookPen,
  Route,
  Settings,
} from "lucide-react";

export const desktopNavItems = [
  { href: "/", label: "首页", secondary: "Dashboard", icon: Home },
  { href: "/capture", label: "工作记录", secondary: "Records", icon: NotebookPen },
  { href: "/study", label: "学习中心", secondary: "Learning", icon: BookOpen },
  { href: "/plan", label: "成长中心", secondary: "Growth", icon: Route },
  { href: "/assessment", label: "评估与复盘", secondary: "Assessment", icon: GraduationCap },
  { href: "/history", label: "历史", secondary: "History", icon: History },
  { href: "/help", label: "帮助", secondary: "Help", icon: CircleHelp },
] as const;

export const mobileNavItems = [
  { href: "/", label: "首页", icon: Home },
  { href: "/study", label: "学习", icon: BookOpen },
  { href: "/capture", label: "记录", icon: NotebookPen },
  { href: "/assessment", label: "评估", icon: GraduationCap },
  { href: "/plan", label: "成长", icon: Route },
] as const;

export const settingsItem = {
  href: "/settings",
  label: "设置",
  secondary: "Settings",
  icon: Settings,
} as const;
