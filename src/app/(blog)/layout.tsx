import { Header } from "@/components/blog/Header/Header";
import { Footer } from "@/components/blog/Footer/Footer";

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
