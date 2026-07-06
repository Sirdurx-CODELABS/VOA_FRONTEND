import { SIDEBAR_CONFIG, SidebarItem } from '@/config/sidebarConfig';
import { Permission } from '@/lib/permissions';

type RouteMap = Record<string, Permission | null>;

function buildRouteMap(): RouteMap {
  const map: RouteMap = {};
  const walk = (items: SidebarItem[]) => {
    for (const item of items) {
      if (item.children) {
        for (const child of item.children) {
          const path = child.href.split('?')[0];
          map[path] = child.permission;
        }
      } else if (item.href) {
        const path = item.href.split('?')[0];
        map[path] = item.permission ?? null;
      }
    }
  };
  walk(SIDEBAR_CONFIG);
  return map;
}

const ROUTE_PERMISSIONS = buildRouteMap();

export function getRequiredPermission(pathname: string): Permission | null {
  const path = pathname.split('?')[0];
  return ROUTE_PERMISSIONS[path] ?? null;
}
