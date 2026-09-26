import React, { useLayoutEffect, useRef } from 'react';

// A data table that turns into stacked cards on phones (see .responsive-table in index.css).
// Each cell is labelled with its column heading, so a card row still reads "Price: Rs 6,000,000".
// Labels are copied from the <th> elements after every render, so callers write a normal table.
export const ResponsiveTable: React.FC<React.TableHTMLAttributes<HTMLTableElement>> = ({ className, children, ...props }) => {
  const tableRef = useRef<HTMLTableElement>(null);

  useLayoutEffect(() => {
    const table = tableRef.current;
    if (!table) return;
    const headings = Array.from(table.querySelectorAll('thead th')).map((heading) => heading.textContent?.trim() ?? '');
    table.querySelectorAll('tbody tr').forEach((row) => {
      Array.from(row.children).forEach((cell, index) => {
        const label = headings[index];
        if (label) cell.setAttribute('data-label', label);
        else cell.removeAttribute('data-label');
      });
    });
  });

  return <table ref={tableRef} className={`data-table responsive-table ${className ?? ''}`} {...props}>{children}</table>;
};
