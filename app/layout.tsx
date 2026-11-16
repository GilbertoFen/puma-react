import "./globals.css";
import "./src/styles/globals.css";
import { UserProvider } from "./src/context/UserContext";
import SessionBootstrap from "./src/components/SessionBootstrap";
import { SessionProvider } from "./src/context/SessionContext";
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <UserProvider>
    <html
      lang="en" >
      <body
      className="min-h-full flex flex-col">
        <SessionBootstrap>
          <SessionProvider>{children}</SessionProvider>
        </SessionBootstrap>
      </body>
    </html>
    </UserProvider>
  );
}
