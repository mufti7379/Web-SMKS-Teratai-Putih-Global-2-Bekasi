import { useLocation } from "react-router-dom";
import { NavMenu, NavMenuMobile, navMenuItemClass, navMenuMobileItemClass } from "@/components/NavMenu";
import { SchoolLink } from "@/components/SchoolLink";
import { useNavText } from "@/lib/navText";
import { schoolLinks } from "@/lib/schoolLinks";

const services = schoolLinks.filter((link) => link.hint);
const slug = (label: string) => label.toLowerCase().replaceAll(" ", "-");
const isServicePage = (pathname: string) => services.some(({ href }) => href === pathname);

/**
 * "Layanan" in the site header (from lg up): the school's online services, most of them a site
 * of their own. Underlined, with the entry shaded, while on one that's a page of this site.
 */
export function ServicesNavMenu() {
  const { pathname } = useLocation();
  const t = useNavText();
  return (
    <NavMenu label={t("Layanan")} active={isServicePage(pathname)} testId="nav-link-layanan" menuTestId="nav-services-menu">
      {(close) => services.map(({ label, href, hint }) => (
        <li key={label}>
          <SchoolLink href={href} onClick={close} className={`${navMenuItemClass} ${href === pathname ? "bg-slate-50" : ""}`} data-testid={`nav-service-${slug(label)}`}><span className="block text-sm font-extrabold text-[#0a3358]">{t(label)}</span><span className="mt-0.5 block text-xs text-slate-500">{hint && t(hint)}</span></SchoolLink>
        </li>
      ))}
    </NavMenu>
  );
}

/** "Layanan" in the site header's hamburger menu, which a tapped service closes behind it. */
export function ServicesNavMobile({ onPick }: { onPick: () => void }) {
  const { pathname } = useLocation();
  const t = useNavText();
  return (
    <NavMenuMobile label={t("Layanan")} active={isServicePage(pathname)} testId="mobile-nav-link-layanan" listTestId="mobile-nav-services">
      {services.map(({ label, href }) => (
        <li key={label}>
          <SchoolLink href={href} onClick={onPick} className={`${navMenuMobileItemClass} ${href === pathname ? "text-[#0f4c81]" : "text-slate-500"}`} data-testid={`mobile-nav-service-${slug(label)}`}>{t(label)}</SchoolLink>
        </li>
      ))}
    </NavMenuMobile>
  );
}
