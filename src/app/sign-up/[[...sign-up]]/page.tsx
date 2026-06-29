import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gb-bg flex flex-col items-center justify-center px-4 py-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-2xl bg-gb-green2 flex items-center justify-center text-xl">🪝</div>
        <div>
          <div className="text-gb-fg font-bold text-xl tracking-tight leading-none">LureLoadout</div>
          <div className="text-gb-faint text-xs mt-0.5 font-medium">Know what to throw</div>
        </div>
      </div>
      <SignUp />
    </div>
  );
}
