import {
  BarChart3,
  Home,
  Package,
  Settings,
  ShoppingBag,
  Store,
  Tag,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  key: string;
  label: string;
  href: string;
  /** Match only the exact path (Home). Others match by prefix. */
  exact?: boolean;
  icon: LucideIcon;
}

/** Single source for sidebar, tab bar, drawer. */
export function buildMerchantNav(baseHref: string) {
  const main: NavItem[] = [
    { key: "home", label: "Home", href: baseHref, exact: true, icon: Home },
    { key: "orders", label: "Orders", href: `${baseHref}/orders`, icon: ShoppingBag },
    { key: "products", label: "Products", href: `${baseHref}/products`, icon: Package },
    { key: "customers", label: "Customers", href: `${baseHref}/customers`, icon: Users },
    { key: "discounts", label: "Discounts", href: `${baseHref}/discounts`, icon: Tag },
    { key: "analytics", label: "Analytics", href: `${baseHref}/analytics`, icon: BarChart3 },
    { key: "online-store", label: "Online Store", href: `${baseHref}/themes`, icon: Store },
  ];
  const settings: NavItem = {
    key: "settings",
    label: "Settings",
    href: `${baseHref}/settings`,
    icon: Settings,
  };
  return { main, settings };
}

export function isNavActive(pathname: string, item: NavItem): boolean {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}
