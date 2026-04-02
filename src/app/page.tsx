import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <main className="flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl mb-6">
          STEM Quiz Platform
        </h1>
        <p className="max-w-[600px] text-lg text-muted-foreground mb-8">
          A secure, LaTeX-ready assessment platform built for complex technical questions and robust exam integrity.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/auth/signin">
            <Button size="lg" className="w-full sm:w-auto">Sign In</Button>
          </Link>
          <Link href="/auth/signup">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">Register</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
