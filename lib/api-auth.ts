import type { Session } from "next-auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import type { UserAccessScope } from "@/lib/dataverse/models";
import { authOptions } from "@/lib/auth";

interface ApiAccessContext extends UserAccessScope {
  email?: string;
}

type ApiAccessResult =
  | { response: NextResponse }
  | { access: ApiAccessContext; session: Session };

function normalizeEmail(value?: string | null) {
  return value?.trim().toLowerCase() || undefined;
}

function normalizeName(value?: string | null) {
  return value?.replace(/\s+/g, " ").trim() || undefined;
}

function getAdminEmails() {
  return new Set(
    (process.env.AUTH_ADMIN_EMAILS ?? "")
      .split(",")
      .map((value) => normalizeEmail(value))
      .filter((value): value is string => Boolean(value))
  );
}

function toAccessContext(session: Session): ApiAccessContext {
  const email = normalizeEmail(session.user?.email);
  const userName = normalizeName(session.user?.name);
  const isAdmin = email ? getAdminEmails().has(email) : false;

  return {
    email,
    isAdmin,
    userName,
    bauleiter: isAdmin ? undefined : userName
  };
}

export async function requireApiAccess(): Promise<ApiAccessResult> {
  const session = await getServerSession(authOptions);

  if (!session) {
    return {
      response: NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    };
  }

  const access = toAccessContext(session);

  if (!access.isAdmin && !access.bauleiter) {
    return {
      response: NextResponse.json(
        { message: "Kein Bauleiter-Name im Benutzerprofil gefunden." },
        { status: 403 }
      )
    };
  }

  return { access, session };
}

export async function ensureApiSession() {
  const result = await requireApiAccess();
  return "response" in result ? result.response : null;
}
