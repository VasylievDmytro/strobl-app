import { withAuth } from "next-auth/middleware";

export const config = {
  matcher: [
    "/",
    "/btr-system/:path*",
    "/rechnungen/:path*",
    "/transportbericht/:path*",
    "/tagesbericht/:path*",
    "/geocapture/:path*",
    "/smapone/:path*"
  ]
};

export default withAuth({
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  pages: {
    signIn: "/login"
  }
});
