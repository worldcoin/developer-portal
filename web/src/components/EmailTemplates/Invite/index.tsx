/* eslint-disable @next/next/no-img-element */
import { Button } from "@/components/EmailTemplates/common/Button";
import { Layout } from "@/components/EmailTemplates/common/Layout";
import { Link } from "@/components/EmailTemplates/common/Link";

export const Invite = (props: {
  email: string;
  invitedBy: { name: string; email: string };
  teamName: string;
  link: string;
}) => {
  return (
    <Layout
      title={"Teamate invited you"}
      style={{
        textAlign: "center",
      }}
    >
      <h1
        style={{
          marginBottom: 4,
          fontSize: 24,
          lineHeight: 1.2,
        }}
      >
        Teamate invited you
      </h1>

      <span style={{ fontSize: 14, color: "#858494" }}>
        You&apos;ve gotten new team invitation
      </span>

      <img
        src={`${process.env.NEXT_PUBLIC_APP_URL}/email/invite.png`}
        width={104}
        height={104}
        alt="Invite"
        style={{
          margin: "48px auto",
        }}
      />

      <h2 style={{ marginBottom: 24 }}>
        <b>Hello {props.email}</b>
      </h2>

      <div
        style={{
          color: "#858494",
        }}
      >
        <p>You were invited by</p>

        <p style={{ color: "#000" }}>
          <b>{props.invitedBy.name}</b>
        </p>

        <Link href={`mailto:${props.invitedBy.email}`}>
          <b>{props.invitedBy?.email}</b>
        </Link>

        <p>to join team {props.teamName}.</p>
      </div>

      <Button href={props.link} style={{ marginTop: 64, marginBottom: 16 }}>
        Join the team
      </Button>

      <span
        style={{
          fontSize: 14,
          color: "#858494",
        }}
      >
        Invite expires in 7 days
      </span>

      <p style={{ marginTop: 64, fontSize: 12, color: "#858494" }}>
        Why did I get this invite and What&apos;s Worldcoin Dev Portal?
        <br />
        {/* FIXME: add link */}
        Read all about it <Link href="#!">here</Link>
      </p>
    </Layout>
  );
};
