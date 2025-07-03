import { Button } from "@/components/Button";
import { CopyButton } from "@/components/CopyButton";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Dialog } from "@/components/Dialog";
import { DialogOverlay } from "@/components/DialogOverlay";
import { DialogPanel } from "@/components/DialogPanel";
import { CloseIcon } from "@/components/Icons/CloseIcon";
import { TextArea } from "@/components/TextArea";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import clsx from "clsx";
import { ChangeEvent, useState } from "react";
import { toast } from "react-toastify";
import { ImageValidationError } from "../../hook/use-image";
import { AppStoreFormValues } from "../form-schema";

type ImportExportJSONProps = {
  appId: string;
  appMetadataId: string;
  teamId: string;
  disabled: boolean;
  localisationsData: AppStoreFormValues["localisations"];
};

const getLocalisationsDataJSON = (
  localisationsData: AppStoreFormValues["localisations"],
) => {
  try {
    return JSON.stringify(
      localisationsData.map((localisation) => {
        return {
          language: localisation.language,
          name: localisation.name,
          short_name: localisation.short_name,
          app_tag_line: localisation.world_app_description,
          description_overview: localisation.description_overview,
        };
      }),
      null,
      2,
    );
  } catch (error) {
    console.error("Error getting localisations data JSON: ", error);
    return "[]";
  }
};

export const ImportExportJSON = (props: ImportExportJSONProps) => {
  const { appId, appMetadataId, teamId, disabled, localisationsData } = props;
  const [showDialog, setShowDialog] = useState(false);

  const handleFileInput = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;

    if (file && file.type === "application/json") {
      try {
        toast.info("Uploading image", {
          toastId: "upload_toast",
          autoClose: false,
        });

        toast.dismiss("ImageValidationError");

        toast.update("upload_toast", {
          type: "success",
          render: "Image uploaded and saved",
          autoClose: 5000,
        });
        setShowDialog(false);
      } catch (error) {
        console.error("Logo Upload Failed: ", error);

        if (error instanceof ImageValidationError) {
          toast.dismiss("upload_toast");
        } else {
          toast.update("upload_toast", {
            type: "error",
            render: "Error uploading image",
            autoClose: 5000,
          });
        }
      }
    }
  };

  const localisationsDataJSON = getLocalisationsDataJSON(localisationsData);
  const textAreaRows = localisationsDataJSON.split("\n").length + 2;
  return (
    <>
      <div
        className={clsx(
          "relative flex w-20 flex-col items-center justify-center",
        )}
      >
        <Dialog open={showDialog} onClose={() => setShowDialog(false)}>
          <DialogOverlay />
          <DialogPanel className="grid gap-y-10 md:max-w-[40rem]">
            <div className="grid w-full grid-cols-1fr/auto justify-between gap-x-2">
              <Typography variant={TYPOGRAPHY.H6}>
                Import/Export localisations JSON
              </Typography>
              <Button
                type="button"
                onClick={() => setShowDialog(false)}
                className="flex size-7 items-center justify-center rounded-full bg-grey-100 hover:bg-grey-200"
              >
                <CloseIcon className="size-4" />
              </Button>
            </div>
            {/* copy-only textarea */}
            <div className="grid gap-y-3">
              <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
                Copy the JSON content from the file you want to import.
              </Typography>
              <TextArea
                register={{} as any}
                label=""
                value={localisationsDataJSON}
                disabled
                rows={textAreaRows}
                enableResize={false}
                topAddOn={
                  <CopyButton
                    fieldName="JSON"
                    fieldValue={localisationsDataJSON}
                  />
                }
                onChange={() => {}}
                className="max-h-[50svh] w-full"
              />
            </div>
          </DialogPanel>
        </Dialog>
      </div>
      <DecoratedButton
        variant="primary"
        type="button"
        disabled={disabled}
        onClick={() => setShowDialog(true)}
      >
        Import/Export
      </DecoratedButton>
    </>
  );
};
