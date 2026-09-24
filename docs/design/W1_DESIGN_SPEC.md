# W1 Dashboard Design Spec

## Source concepts

- `dashboard-mobile.png`：393px 移动端主规格
- `dashboard-desktop.png`：1440px 桌面端主规格

## Design system

- Background: true white `#ffffff`
- Ink: `#0b1830`
- Muted: `#69768a`
- Divider: `#dfe5eb`
- Accent: `#087f6b`
- Accent strong: `#066653`
- Accent soft: `#eaf7f4`
- Sidebar: `#f7fafb`
- Typography: Geist, PingFang SC, Microsoft YaHei, sans-serif
- Base spacing: 8px
- Minimum touch target: 44px
- Icon treatment: Lucide outline, generally 1.75px stroke

## Container model

Mobile uses open vertical sections, a single recommendation surface, a bordered review row, and a fixed five-item bottom navigation. Desktop uses a fixed 256px sidebar and a main content area capped at 1220px. Avoid bento grids, nested cards, gradients, gamification, and complex charts.

## Responsive behavior

- `< 1024px`: bottom navigation, no sidebar
- `>= 1024px`: fixed sidebar, no bottom navigation
- Main content never creates horizontal overflow at 320px, 375px, or 393px
- Bottom content includes enough space for safe-area navigation
