"use client";
import { DecoratedButton } from "@/components/DecoratedButton";
import { SearchIcon } from "@/components/Icons/SearchIcon";
import { Input } from "@/components/Input";
import { Notification } from "@/components/Notification";
import { Section } from "@/components/Section";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import Skeleton from "react-loading-skeleton";
import { type useGetActionsQuery } from "../graphql/client/actions.generated";
import { Item } from "./Item";

export const ActionsList = (props: {
  searchForm: ReturnType<typeof useForm<{ keyword: string }>>;
  items: ReturnType<typeof useGetActionsQuery>;
  generateItemHref: (id: string) => string;
  engineType?: string;
  isReadOnly?: boolean;
}) => {
  const { searchForm, items, generateItemHref, isReadOnly } = props;
  const router = useRouter();

  const keyword = useWatch({
    control: searchForm.control,
    name: "keyword",
  });

  return (
    <Section>
      <Section.Header>
        <Section.Header.Title className="grid gap-y-3">
          {isReadOnly ? "World ID 3.0 Legacy" : "Incognito Actions"}
          <Typography as="p" variant={TYPOGRAPHY.R3} className="text-grey-500">
            Allow users to verify that they are a unique person without
            revealing their identity
          </Typography>
        </Section.Header.Title>

        {isReadOnly && (
          <div className="mt-6 md:col-span-2">
            <Notification variant="warning">
              <div className="text-system-warning-800">
                <Typography as="p" variant={TYPOGRAPHY.S3}>
                  This functionality is deprecated in 4.0. It's still viewable
                  for your convenience. Please make all new actions in the 4.0
                  view.
                </Typography>
              </div>
            </Notification>
          </div>
        )}

        <Section.Header.Search className="md:col-span-2">
          <Input
            register={searchForm.register("keyword")}
            label=""
            placeholder="Search actions by name"
            className="w-full pt-2 text-base"
            addOnLeft={<SearchIcon className="mx-2 text-grey-400" />}
          />
        </Section.Header.Search>

        {!isReadOnly && (
          <Section.Header.Button className="max-md:!bottom-[4.25rem] md:row-start-1 md:items-start">
            {!keyword && items.loading ? (
              <Skeleton className="h-12 w-[12rem] rounded-xl" />
            ) : (
              <DecoratedButton
                className="h-12 min-w-[12rem]"
                href="?createAction=true"
              >
                <Typography
                  variant={TYPOGRAPHY.M3}
                  className="whitespace-nowrap"
                >
                  New action
                </Typography>
              </DecoratedButton>
            )}
          </Section.Header.Button>
        )}
      </Section.Header>

      <div className="md:grid md:grid-cols-[auto_auto_max-content]">
        <div className="max-md:grid max-md:grid-cols-2 max-md:border-x max-md:border-transparent max-md:px-4 md:contents">
          <div className="py-3 md:border-b md:border-gray-100">
            <Typography variant={TYPOGRAPHY.R5} className="text-grey-400">
              Name
            </Typography>
          </div>

          <div className="py-3 pl-2 max-md:text-end md:col-span-2 md:border-b md:border-gray-100">
            <Typography variant={TYPOGRAPHY.R5} className="text-grey-400">
              Uses
            </Typography>
          </div>
        </div>

        {items.loading && <Item />}

        <div className="max-md:grid max-md:gap-y-2 md:contents">
          {items.data?.actions.map((item, index: number) => {
            return (
              <Link
                key={item.id}
                className="contents"
                href={generateItemHref(item.id)}
              >
                <Item
                  item={item}
                  onClickView={() => router.push(generateItemHref(item.id))}
                />
              </Link>
            );
          })}
        </div>
      </div>
    </Section>
  );
};
