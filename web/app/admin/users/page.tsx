import { generateMetaTitle } from "@/lib/genarate-title";
import { AdminUsersPage } from "@/scenes/Admin/users/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Users" }),
};

export default AdminUsersPage;
