import sendgrid from "@sendgrid/mail";
import { inspect } from "util";

// This type going to persist even after provider has changed
type EmailData = string | { name?: string; email: string };

type Attachment = {
  content: string;
  filename: string;
  type?: string;
  disposition?: string;
};

export const sendEmail = async (params: {
  apiKey: string;
  to: Array<EmailData> | EmailData;
  from: EmailData;
  subject?: string;
  templateData?: Record<string, any>;
  templateId?: string;
  text?: string;
  html?: string;
  attachments?: Array<Attachment>;
}): Promise<boolean> => {
  if (
    (params.templateId && !params.templateData) ||
    (!params.templateId && params.templateData)
  ) {
    throw new Error("templateId and templateData must be passed together");
  }
  if (!params.templateId && !params.text) {
    throw new Error("Either templateId OR text must be passed");
  }

  sendgrid.setApiKey(params.apiKey);

  try {
    await sendgrid.send({
      ...(params.attachments ? { attachments: params.attachments } : {}),
      ...(params.templateId && params.templateData
        ? {
            dynamicTemplateData: params.templateData,
            templateId: params.templateId,
          }
        : {
            // we should probably always use templates in prod but this at least makes this flexible for testing
            ...(params.html ? { html: params.html } : {}),
            ...(params.subject ? { subject: params.subject } : {}),
            text: params.text!,
          }),
      from: params.from,
      to: params.to,
    });
  } catch (err) {
    console.log(inspect(err, { depth: 16 }));
    throw err;
  }

  return true;
};
