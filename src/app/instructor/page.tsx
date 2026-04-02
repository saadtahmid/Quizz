import { auth, signOut } from "@/lib/auth"
import { Button } from "@/components/ui/button"

export default async function InstructorDashboard() {
  const session = await auth()

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Instructor Dashboard</h1>
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
          <h2 className="text-xl font-semibold mb-2">My Quizzes</h2>
          <p className="text-muted-foreground mb-4">Manage and create new quizzes for your students.</p>
          <Button>Create Quiz</Button>
        </div>
      </div>
    </div>
  )
}
