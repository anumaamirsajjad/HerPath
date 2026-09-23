import ProfileForm from "@/components/ProfileForm";
import RequireAuth from "@/components/RequireAuth";

export default function Page() { return <RequireAuth><ProfileForm /></RequireAuth>; }
