import "./globals.css";
import { UserProvider } from "./src/context/UserContext";
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
      className="min-h-full flex flex-col">{children}
      </body>
    </html>
    </UserProvider>
  );
}
