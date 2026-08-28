import sendgrid from "@sendgrid/mail";

// This type going to persist even after provider has changed
type EmailData = string | { name?: string; email: string };

type Attachment = {
  content: string;
  filename: string;
  type?: string;
  disposition?: string;
};

type SendEmailParams = {
  apiKey: string;
  to: Array<EmailData> | EmailData;
  from: EmailData;
  subject?: string;
  templateData?: Record<string, any>;
  templateId?: string;
  text?: string;
  html?: string;
  attachments?: Array<Attachment>;
  customArgs?: Record<string, string>;
};

export const sendEmailDetailed = async (
  params: SendEmailParams,
): Promise<{ messageId: string | null }> => {
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
  sendgrid.setTimeout(15_000);

  try {
    const result = await sendgrid.send({
      ...(params.attachments ? { attachments: params.attachments } : {}),
      mailSettings: {
        bypassUnsubscribeManagement: {
          enable: true,
        },
      },
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
      ...(params.customArgs ? { customArgs: params.customArgs } : {}),
    });
    const response = Array.isArray(result) ? result[0] : undefined;
    const rawMessageId = response?.headers?.["x-message-id"];
    const messageId = Array.isArray(rawMessageId)
      ? rawMessageId[0]
      : rawMessageId;
    return {
      messageId:
        typeof messageId === "string" && messageId.length <= 512
          ? messageId
          : null,
    };
  } catch (err: any) {
    const emails = [params.to]
      .flat()
      .map((email) => (typeof email === "string" ? email : email.email))
      .join(", ");
    throw new Error(`Cannot send email for user ${emails}: ${err.message}`);
  }
};

export const sendEmail = async (params: SendEmailParams): Promise<boolean> => {
  await sendEmailDetailed(params);
  return true;
};
