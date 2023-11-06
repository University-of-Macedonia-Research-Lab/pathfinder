import { Breadcrumbs } from "@mui/material";
import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

const Breadcrumb: React.FC<BreadcrumbsProps> = ({ items }) => {
  return (
    <Breadcrumbs separator="/">
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
    </Breadcrumbs>
  );
};

export default Breadcrumb;
