-- Create affiliate_status enum table
CREATE TABLE affiliate_status (
  value text PRIMARY KEY,
  comment text
);

INSERT INTO affiliate_status (value, comment) VALUES
  ('none', 'Team has not requested affiliate status'),
  ('pending', 'Team has requested affiliate status and is awaiting approval'),
  ('approved', 'Team affiliate request has been approved'),
  ('rejected', 'Team affiliate request has been rejected');

-- Add affiliate_status column to team table
ALTER TABLE "public"."team" ADD COLUMN "affiliate_status" text NOT NULL DEFAULT 'none';

-- Add foreign key constraint
ALTER TABLE "public"."team" 
  ADD CONSTRAINT "team_affiliate_status_fkey" 
  FOREIGN KEY ("affiliate_status") 
  REFERENCES "public"."affiliate_status" ("value") 
  ON UPDATE RESTRICT ON DELETE RESTRICT;

