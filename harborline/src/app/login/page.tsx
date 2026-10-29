import { Suspense } from "react";
import MarketingHeader from "@/components/marketing-header";
import AuthForm from "@/components/auth-form";

export const metadata = { title: "Log in" };
export default function LoginPage() {
  return (<><MarketingHeader /><Suspense><AuthForm mode="login" /></Suspense></>);
}
