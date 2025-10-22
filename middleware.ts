import { withAuth } from "next-auth/middleware";
import { NextRequest, NextResponse } from "next/server";

export const middleware = withAuth(
  function middleware(request: NextRequest & { nextauth: any }) {
    const pathname = request.nextUrl.pathname;
    const userRole = request.nextauth?.token?.role;

    // Role-based route protection
    if (pathname.startsWith("/dashboard")) {
      if (!userRole) {
        return NextResponse.redirect(new URL("/auth/login", request.url));
      }

      if (pathname.startsWith("/dashboard/manager-traffic") && userRole !== "MANAGER_TRAFFIC") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }

      if (pathname.startsWith("/dashboard/manager-operational") && userRole !== "MANAGER_OPERATIONAL") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }

      if (pathname.startsWith("/dashboard/petugas-lapangan") && userRole !== "PETUGAS_LAPANGAN") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        if (req.nextUrl.pathname.startsWith("/dashboard")) {
          return !!token;
        }
        return true;
      },
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*"],
};
