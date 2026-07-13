"use client";

import { DecoratedButton } from "@/components/DecoratedButton";
import { Dialog } from "@/components/Dialog";
import { DialogOverlay } from "@/components/DialogOverlay";
import { DialogPanel } from "@/components/DialogPanel";
import { Input } from "@/components/Input";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { useEffect, useState } from "react";
import type { FieldError } from "react-hook-form";
import { isValidHttpsDomain, normalizeDomainInput } from "./domain-utils";

type DomainDialogProps = {
  open: boolean;
  // null means "add" mode; a string is the domain being edited
  editingDomain: string | null;
  existingDomains: string[];
  onClose: () => void;
  onSave: (domain: string) => void;
};

export const DomainDialog = (props: DomainDialogProps) => {
  const { open, editingDomain, existingDomains, onClose, onSave } = props;
  const isEditing = editingDomain !== null;
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setValue(editingDomain ?? "");
      setError(null);
    }
  }, [open, editingDomain]);

  const submit = () => {
    const domain = normalizeDomainInput(value);

    if (!isValidHttpsDomain(domain)) {
      setError("Enter a valid HTTPS URL, e.g. https://example.com");
      return;
    }

    if (
      existingDomains.some(
        (existing) => existing !== editingDomain && existing === domain,
      )
    ) {
      setError("This domain has already been added.");
      return;
    }

    onSave(domain);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogOverlay />

      <DialogPanel className="md:max-w-[28rem]">
        <form
          className="grid w-full gap-y-6"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            submit();
          }}
        >
          <div className="grid gap-y-2">
            <Typography variant={TYPOGRAPHY.H6} className="text-grey-900">
              {isEditing ? "Edit domain" : "Add domain"}
            </Typography>
          </div>

          <Input
            label="Domain URL"
            placeholder="https://example.com"
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              setError(null);
            }}
            errors={
              error
                ? ({ type: "manual", message: error } as FieldError)
                : undefined
            }
          />

          <div className="grid w-full grid-cols-2 gap-x-4">
            <DecoratedButton
              type="button"
              variant="secondary"
              onClick={onClose}
            >
              Cancel
            </DecoratedButton>

            <DecoratedButton type="submit" className="whitespace-nowrap">
              {isEditing ? "Save" : "Add domain"}
            </DecoratedButton>
          </div>
        </form>
      </DialogPanel>
    </Dialog>
  );
};
