export const apiKeysTableColumnsClassName =
  "grid-cols-[repeat(3,minmax(0,1fr))_52px]";

export const ApiKeysTableHeader = () => (
  <div role="rowgroup">
    <div
      role="row"
      className={`grid h-12 ${apiKeysTableColumnsClassName} items-center border-b border-portal-border bg-[#f7f7f7] font-world text-13 leading-[1.3] font-[350] text-[#808080]`}
    >
      <span role="columnheader" className="px-4">
        Name
      </span>
      <span role="columnheader" className="px-4">
        Created
      </span>
      <span role="columnheader" className="px-4">
        Status
      </span>
      <span role="columnheader" aria-label="Actions" />
    </div>
  </div>
);
