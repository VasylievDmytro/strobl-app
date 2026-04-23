"use client";

import { LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

export function UserBar() {
  const { data: session } = useSession();
  const userLabel = session?.user?.name ?? session?.user?.email ?? "Benutzer";

  return (
    <div className="mb-3 hidden lg:flex lg:justify-end">
      <div className="inline-flex items-center gap-2.5 rounded-[1rem] border border-white/85 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(247,251,255,0.88))] px-3 py-2 shadow-[0_16px_30px_-24px_rgba(17,49,87,0.28)] backdrop-blur-xl 2xl:gap-3 2xl:px-3.5">
        <div className="grid h-7 w-7 place-items-center rounded-full bg-strobl-50 text-[11px] font-semibold text-strobl-700">
          {userLabel.slice(0, 1).toUpperCase()}
        </div>
        <p className="max-w-[132px] truncate text-sm font-semibold text-ink-800 2xl:max-w-[150px]">{userLabel}</p>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="inline-flex items-center gap-1.5 rounded-[0.85rem] border border-[#d8e3ed] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-ink-700 transition hover:bg-strobl-50 hover:text-strobl-800"
        >
          <LogOut className="h-3.5 w-3.5" />
          Abmelden
        </button>
      </div>
    </div>
  );
}
