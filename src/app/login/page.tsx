import { isDemoAuthMode } from "@/lib/auth/demo-session";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return <LoginForm demoEnabled={isDemoAuthMode()} />;
}
