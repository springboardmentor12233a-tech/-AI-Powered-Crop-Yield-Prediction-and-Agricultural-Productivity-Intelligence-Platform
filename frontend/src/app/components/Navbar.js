"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUser, logout } from "@/lib/auth";

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  // localStorage isn't available during server rendering, so the user is
  // read only after the component mounts on the client. This avoids a
  // server/client HTML mismatch (hydration error).
  useEffect(() => {
    setUser(getUser());
  }, []);

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <div className="w-full border-b border-zinc-200 bg-white shadow-sm">
      <div className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between">
        <span className="text-base font-semibold text-green-800">
          YieldSense AI
        </span>

        {user && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-green-100 text-green-800 flex items-center justify-center text-sm font-semibold">
                {user.name?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="leading-tight">
                <p className="text-sm font-medium text-zinc-900">
                  {user.name}
                </p>
                <p className="text-xs text-zinc-500 capitalize">
                  {user.role}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 hover:border-red-300 transition-colors"
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}