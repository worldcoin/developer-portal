"use client";
import { DecoratedButton } from "@/components/DecoratedButton";
import { IdentificationIcon } from "@/components/Icons/IdentificationIcon";
import { MailWithLines } from "@/components/Icons/MailWithLines";
import { PlusIcon } from "@/components/Icons/PlusIcon";
import { QuickAction } from "@/components/QuickAction";
import { Section } from "@/components/Section";
import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { urls } from "@/lib/urls";
import { useState } from "react";
import Skeleton from "react-loading-skeleton";
import { ApiKeysTable } from "./ApiKeyTable";
import { CreateKeyModal } from "./CreateKeyModal";
import { useFetchKeysQuery } from "./graphql/client/fetch-keys.generated";

type TeamApiKeysPageProps = {
  params: Record<string, string> | null | undefined;
};

export const AffiliateProgramPage = (props: TeamApiKeysPageProps) => {
  const { params } = props;
  const teamId = params?.teamId;
  const [showCreateKeyModal, setShowCreateKeyModal] = useState(false);
  const { data, loading } = useFetchKeysQuery({
    variables: { teamId: teamId ?? "" },
  });

  const apiKeys = data?.api_key;
  return (
    <>
      <SizingWrapper gridClassName="order-2 grow" className="flex flex-col place-content-center">
        <CreateKeyModal
          teamId={teamId ?? ""}
          isOpen={showCreateKeyModal}
          setIsOpen={setShowCreateKeyModal}
        />

        {!loading && apiKeys?.length === 0 ? (
          <div className="grid grid-cols-1 justify-items-center pt-12">
                          <MailWithLines className="md:max-w-[380px]" />

            <div className="grid justify-items-center gap-y-2 mt-4 ">
              <Typography variant={TYPOGRAPHY.H6}>Invite humans and earn rewards</Typography>

              <Typography
                variant={TYPOGRAPHY.R4}
                className="text-center text-grey-500"
              >
                  Receive rewards for each human that uses your code and gets verified
              </Typography>
            </div>

            <QuickAction
          icon={<IdentificationIcon />}
          title="Complete KYB"
          description="To unlock affiliate program"
          hideArrow
          href={urls.createAction({ team_id: teamId, app_id: "" })}
          className="flex mt-10 gap-2"
        >
          <DecoratedButton
                  type="button"
                  onClick={() => setShowCreateKeyModal(true)}
              >
                Complete
              </DecoratedButton>
        </QuickAction>

        

            {/* <div className="flex items-center gap-3 border border-grey-200 p-6 rounded-xl">
              <div className="text-start">
                <Typography
                  as="p"
                  variant={TYPOGRAPHY.M3}
                >
                    Complete KYB
                </Typography>
                <Typography
                  as="p"
                  variant={TYPOGRAPHY.R5}
                  className="text-grey-500"
                >
                    To unlock affiliate program
                </Typography>
              </div>
              <DecoratedButton
                  type="button"
                  onClick={() => setShowCreateKeyModal(true)}
              >
                Complete
              </DecoratedButton>
            </div> */}
          </div>
        ) : (
          <Section>
            <Section.Header>
              <Section.Header.Title>API keys</Section.Header.Title>

              <Section.Header.Button>
                {loading ? (
                  <Skeleton width={150} />
                ) : (
                  <DecoratedButton
                    type="button"
                    variant="primary"
                    onClick={() => setShowCreateKeyModal(true)}
                    className="py-3"
                  >
                    <PlusIcon className="size-5" /> New key
                  </DecoratedButton>
                )}
              </Section.Header.Button>
            </Section.Header>

            <div className="order-2 md:pb-8">
              {loading ? (
                <Skeleton count={5} />
              ) : (
                <ApiKeysTable teamId={teamId} apiKeys={apiKeys} />
              )}
            </div>
          </Section>
        )}
      </SizingWrapper>
    </>
  );
};
