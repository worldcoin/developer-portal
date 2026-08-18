"use client";

import { Link } from "@/components/Link";
import {
  formCountriesList,
  formLanguagesList,
  languageMap,
} from "@/lib/languages";
import { WarningBadgeIcon } from "@/scenes/PortalV3/common/Icon";
import { useMemo, useState } from "react";
import { Controller } from "react-hook-form";
import { useAppStoreFormContext } from "../AppStore/app-store";
import { ClearConfirmationModal } from "../AppStore/components/ClearConfirmationModal";
import { ChipSelect } from "./ChipSelect";
import { SectionHeader } from "./SectionHeader";

const EcosystemLink = () => (
  <Link href="https://world.org/ecosystem" className="underline">
    ecosystem page
  </Link>
);

const LawsAndRegulationsBanner = () => (
  // Figma nucleus/status-warning (#ffae00) — no portal token for it yet
  // (closest, system-warning-500, is #ffb200). The #fff6e6 fill maps to the
  // existing system-warning-75 token.
  <div className="flex w-full items-center gap-3 rounded-[10px] bg-system-warning-75 p-4">
    <WarningBadgeIcon className="bg-[#ffae00]" />
    <p className="min-w-0 flex-1 text-13 leading-[1.2] font-medium text-[#ffae00]">
      Laws and regulations governing mini apps vary by country and region.
      Before launching, ensure your app complies with all relevant local rules,
      especially regarding chance-based or gambling-like features.
    </p>
  </div>
);

/**
 * Step 2 of the configuration wizard: supported countries and languages,
 * bound to the shared App Store form so autosave and the language ⇄
 * localisation row sync keep working exactly as on the previous page.
 */
export const AvailabilityStep = (props: { isMiniApp: boolean }) => {
  const { control, errors, isEditable, isEnoughPermissions } =
    useAppStoreFormContext();
  const disabled = !isEditable || !isEnoughPermissions;

  const [clearTarget, setClearTarget] = useState<
    "countries" | "languages" | null
  >(null);

  const countryItems = useMemo(
    () =>
      formCountriesList().map((country) => ({
        ...country,
        flagCode: country.value,
      })),
    [],
  );

  const languageItems = useMemo(
    () =>
      formLanguagesList.map((language) => ({
        value: language.value,
        label: language.label,
        flagCode:
          languageMap[language.value as keyof typeof languageMap]?.country_code,
      })),
    [],
  );

  return (
    <div className="flex w-full flex-col gap-14">
      <section className="flex w-full flex-col gap-5">
        <SectionHeader
          title="Supported Countries"
          required
          description={
            props.isMiniApp ? (
              <>
                Choose the countries where your Mini App is available in World
                App and can be featured on the <EcosystemLink />.
              </>
            ) : (
              <>
                Choose the countries where your integration is available and can
                be featured on the <EcosystemLink />.
              </>
            )
          }
        />
        {props.isMiniApp && <LawsAndRegulationsBanner />}
        <Controller
          control={control}
          name="supported_countries"
          render={({ field }) => (
            <>
              <ClearConfirmationModal
                open={clearTarget === "countries"}
                setOpen={(open) => setClearTarget(open ? "countries" : null)}
                type="countries"
                onConfirm={() => field.onChange([])}
              />
              <ChipSelect
                placeholder="Enter country"
                items={countryItems}
                values={field.value ?? []}
                onChange={field.onChange}
                disabled={disabled}
                error={errors.supported_countries?.message}
                selectAllLabel="Add all countries"
                onSelectAll={() =>
                  field.onChange(countryItems.map((item) => item.value))
                }
                onClearAll={() => setClearTarget("countries")}
                canClearAll={(field.value?.length ?? 0) > 0}
              />
            </>
          )}
        />
      </section>

      <section className="flex w-full flex-col gap-5">
        <SectionHeader
          title="Supported Languages"
          required
          description={
            props.isMiniApp ? (
              <>
                Choose the languages for your Mini App listing. People will see
                the localized version in World App and on the <EcosystemLink />.
              </>
            ) : (
              <>
                Choose the languages for your integration&apos;s listing on the{" "}
                <EcosystemLink />. You&apos;ll add the localized content in the
                next step.
              </>
            )
          }
        />
        <Controller
          control={control}
          name="supported_languages"
          render={({ field }) => (
            <>
              <ClearConfirmationModal
                open={clearTarget === "languages"}
                setOpen={(open) => setClearTarget(open ? "languages" : null)}
                type="languages"
                onConfirm={() => field.onChange(["en"])}
              />
              <ChipSelect
                placeholder="Enter language"
                items={languageItems}
                values={field.value ?? ["en"]}
                onChange={field.onChange}
                lockedValues={["en"]}
                disabled={disabled}
                error={errors.supported_languages?.message}
                selectAllLabel="Add all languages"
                onSelectAll={() =>
                  field.onChange(languageItems.map((item) => item.value))
                }
                onClearAll={() => setClearTarget("languages")}
                canClearAll={(field.value?.length ?? 0) > 1}
              />
            </>
          )}
        />
      </section>
    </div>
  );
};
