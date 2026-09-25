import {
  BarChart3,
  BookOpen,
  CalendarDays,
  CircleHelp,
  GraduationCap,
  History,
  ClipboardCheck,
  FileText,
  Gauge,
  Home,
  Lightbulb,
  MessageSquareText,
  NotebookPen,
  Settings,
} from "lucide-react";

export const desktopNavItems = [
  { href: "/", label: "首页", secondary: "Dashboard", icon: Home },
  { href: "/capture", label: "快速记录", secondary: "Capture", icon: NotebookPen },
  { href: "/daily", label: "每日复盘", secondary: "Daily", icon: CalendarDays },
  { href: "/study", label: "学习", secondary: "Study", icon: BookOpen },
  { href: "/quiz", label: "复习", secondary: "Quiz", icon: ClipboardCheck },
  { href: "/knowledge", label: "知识地图", secondary: "Knowledge", icon: Lightbulb },
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
  { href: "/quiz", label: "复习", icon: ClipboardCheck },
  { href: "/capture", label: "记录", icon: NotebookPen },
  { href: "/progress", label: "进度", icon: BarChart3 },
] as const;

export const settingsItem = {
  href: "/settings",
  label: "设置",
  secondary: "Settings",
  icon: Settings,
} as const;
