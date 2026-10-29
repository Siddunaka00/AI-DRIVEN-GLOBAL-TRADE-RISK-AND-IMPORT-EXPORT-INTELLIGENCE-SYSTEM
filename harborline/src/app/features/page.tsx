import { redirect } from "next/navigation";
// Canonical Features route. The content lives on /pricing (kept for old links);
// this alias exists so header links like /features resolve.
export default function FeaturesPage() { redirect("/pricing"); }
