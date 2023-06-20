/* eslint-disable @next/next/no-img-element */
import { Button } from "@/components/EmailTemplates/common/Button";
import { Layout } from "@/components/EmailTemplates/common/Layout";
import { Link } from "@/components/EmailTemplates/common/Link";
import { FetchUserQuery } from "@/api/invite-team-members/graphql/fetchUser.generated";

export const Invite = (props: {
  email: string;
  user: FetchUserQuery["user"][number];
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

      <h2 style={{ marginBottom: 24 }}>
        <b>Hello {props.email}</b>
      </h2>

      <div
        style={{
          color: "#858494",
        }}
      >
        <p>You were invited by</p>

        {props.user.name && (
          <p style={{ color: "#000" }}>
            <b>{props.user.name}</b>
          </p>
        )}

        <Link href={`mailto:${props.user.email}`}>
          <b>{props.user?.email}</b>
        </Link>

        {props.user.team.name && <p>to join team {props.user.team.name}.</p>}
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
