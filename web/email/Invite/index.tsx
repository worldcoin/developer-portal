import { Button } from "email/common/Button";
import { Layout } from "email/common/Layout";

export const Invite = (props) => {
  return (
    <Layout>
      <h1>Teamate invited you</h1>
      <span>You've gotten new team invitation</span>
      <h2>Hello Christina Goldsmith</h2>
      <Button href="#!">Join the team</Button>
      <span>Invite expires in 7 days</span>
      <p>
        Why did I get this invite and What's Worldcoin Dev Portal?
        <br />
        Read all about it here
      </p>
    </Layout>
  );
};
