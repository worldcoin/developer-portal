CREATE TABLE role (
  value text PRIMARY KEY,
  comment text
);

INSERT INTO role (value, comment) VALUES
  ('OWNER', 'Owner of the team'),
  ('ADMIN', 'Users with the privilege to manage other users'),
  ('MEMBER', 'Ordinary users');
