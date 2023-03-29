import { memo } from "react";
import { NotFound } from "src/components/NotFound";

const NotFoundPage = memo(function NotFoundPage() {
  return (
    <div className="w-full min-h-screen flex justify-center items-center">
      <NotFound className="self-center" />
    </div>
  );
});

export default NotFoundPage;
