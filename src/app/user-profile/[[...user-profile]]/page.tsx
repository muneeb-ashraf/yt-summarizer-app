import { UserProfile } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex justify-center items-start min-h-[calc(100vh-4rem)] py-12">
       {/* UserProfile includes its own routing, path prop is essential */}
      <UserProfile path="/user-profile" routing="path" />
    </div>
  );
} 