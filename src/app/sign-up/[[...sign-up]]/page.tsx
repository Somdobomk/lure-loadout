import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gb-bg flex items-center justify-center font-mono">
      <div className="text-center mb-6">
        <div className="text-4xl mb-2">🎣</div>
        <div className="text-gb-yellow font-bold tracking-widest uppercase text-lg">LureLoadout</div>
      </div>
      <SignUp />
    </div>
  );
}
