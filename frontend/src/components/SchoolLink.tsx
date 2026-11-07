import type { AnchorHTMLAttributes } from "react";
import { Link } from "react-router-dom";

type SchoolLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { href: string };

/** An entry of schoolLinks: a page of this site stays in the app, any other site opens in a new tab. */
export function SchoolLink({ href, children, ...props }: SchoolLinkProps) {
  return href.startsWith("/")
    ? <Link to={href} {...props}>{children}</Link>
    : <a href={href} target="_blank" rel="noreferrer" {...props}>{children}</a>;
}
