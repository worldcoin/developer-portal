import cn from "classnames";
import Image from "next/image";
import { useRouter } from "next/router";
import { memo, useCallback } from "react";
import { Button } from "../Button";
import { Icon } from "../Icon";
import notFoundImage from "/public/images/not-found.svg";

export const NotFound = memo(function NotFound(props: { className?: string }) {
  const router = useRouter();

  const handleBackClick = useCallback(() => {
    if (!router.isReady) {
      return;
    }

    router.back();
  }, [router]);

  return (
    <div
      className={cn(
        "grid gap-y-6 justify-items-center content-center",
        props.className
      )}
    >
      <Image src={notFoundImage} alt="Not Found Illustration" />

      <div className="grid gap-y-4 justify-items-center">
        <h1 className="text-20 font-semibold font-sora max-w-[245px] text-center">
          The page you’re looking for can’t be found
        </h1>

        <p className="text-14 text-657080 max-w-[378px] text-center">
          If you&apos;re looking for something and can&apos;t find it, feel free
          to contact us and we will help you out.
        </p>
      </div>

      <Button
        variant="secondary"
        onClick={handleBackClick}
        className="px-4 py-3 border border-ebecef bg-f3f4f5 grid grid-cols-1fr/auto gap-x-2 rounded-lg mt-6"
      >
        <span className="text-14">Take me back</span>
        <Icon name="arrow-right" className="h-5 w-5" />
      </Button>
    </div>
  );
});
