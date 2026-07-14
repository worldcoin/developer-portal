import { UIModule } from "@/components/AdminDashboard/UIModule";

export const AdminAppPage = ({ appId }: { appId: string }) => (
  <UIModule className="p-5">
    <h1 className="text-24 font-semibold tracking-[-0.02em] text-grey-900">
      App details
    </h1>
    <p className="mt-2 font-mono text-14 text-grey-500">{appId}</p>
    <p className="mt-4 text-14 text-grey-500">
      Detailed app inspection is not available yet.
    </p>
  </UIModule>
);
