import { Suspense } from "react";
import MarketingHeader from "@/components/marketing-header";
import AuthForm from "@/components/auth-form";

export const metadata = { title: "Create account" };
export default function RegisterPage() {
  return (<><MarketingHeader /><Suspense><AuthForm mode="register" /></Suspense></>);
}
