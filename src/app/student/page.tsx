import { auth, signOut } from "@/lib/auth"
import { Button } from "@/components/ui/button"

export default async function StudentDashboard() {
  const session = await auth()

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Student Dashboard</h1>
        <div className="flex items-center gap-4">
          <span>Welcome, {session?.user?.name || session?.user?.email}</span>
          <form action={async () => {
            "use server"
            await signOut()
          }}>
            <Button variant="outline">Sign Out</Button>
          </form>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-lg border shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Available Quizzes</h2>
          <p className="text-muted-foreground mb-4">View and take published quizzes.</p>
          <Button>View Quizzes</Button>
        </div>
      </div>
    </div>
  )
}
