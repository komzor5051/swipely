import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import WelcomeFlow from "@/components/onboarding/WelcomeFlow";

export default async function WelcomePage() {
  // createClient from lib/supabase/server.ts is async — must be awaited
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .single();

    if (profile?.onboarding_completed) {
      redirect("/generate");
    }
  }

  return <WelcomeFlow />;
}
