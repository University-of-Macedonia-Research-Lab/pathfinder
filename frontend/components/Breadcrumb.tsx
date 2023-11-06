import { Breadcrumbs as MuiBreadcrumbs } from "@mui/material";
import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  return (
    <MuiBreadcrumbs separator="/">
      {items.map(({ label, path }, index) => {
        const isLastItem = index === items.length - 1;
        const key = path || "" + index;

        const breadcrumb = isLastItem ? (
          <span key={key}>{label}</span>
        ) : (
          <Link href={path || ""} key={key} passHref>
            {label}
          </Link>
        );

        return breadcrumb;
      })}
    </MuiBreadcrumbs>
  );
};

export default Breadcrumbs;
