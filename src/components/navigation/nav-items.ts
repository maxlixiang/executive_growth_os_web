import {
  BarChart3,
  BookOpen,
  CircleHelp,
  GraduationCap,
  History,
  FileText,
  Gauge,
  Home,
  MessageSquareText,
  NotebookPen,
  Route,
  Settings,
} from "lucide-react";

export const desktopNavItems = [
  { href: "/", label: "首页", secondary: "Dashboard", icon: Home },
  { href: "/plan", label: "成长计划", secondary: "Plan", icon: Route },
  { href: "/capture", label: "工作记录", secondary: "Records", icon: NotebookPen },
  { href: "/study", label: "学习中心", secondary: "Learning", icon: BookOpen },
  { href: "/progress", label: "进度", secondary: "Progress", icon: BarChart3 },
  { href: "/assessment", label: "评估", secondary: "Assessment", icon: GraduationCap },
  { href: "/history", label: "历史", secondary: "History", icon: History },
  { href: "/evidence", label: "实践证据", secondary: "Evidence", icon: FileText },
  { href: "/reviews", label: "复盘", secondary: "Reviews", icon: Gauge },
  { href: "/interviews", label: "模拟面试", secondary: "Interviews", icon: MessageSquareText },
  { href: "/help", label: "帮助", secondary: "Help", icon: CircleHelp },
] as const;

export const mobileNavItems = [
  { href: "/", label: "首页", icon: Home },
  { href: "/study", label: "学习", icon: BookOpen },
  { href: "/capture", label: "记录", icon: NotebookPen },
  { href: "/assessment", label: "评估", icon: GraduationCap },
  { href: "/progress", label: "进度", icon: BarChart3 },
] as const;

export const settingsItem = {
  href: "/settings",
  label: "设置",
  secondary: "Settings",
  icon: Settings,
} as const;
