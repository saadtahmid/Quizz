import { auth, signOut } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import prisma from "@/lib/prisma"
import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { revalidatePath } from "next/cache"

export default async function AdminDashboard() {
  const session = await auth()

  if (session?.user?.role !== "ADMIN") {
    return <div className="p-8 text-center text-destructive">Unauthorized. Admin access required.</div>
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' }
  })

  async function deleteUser(userId: string) {
    "use server"
    
    // Prevent admin from deleting themselves
    if (userId === session?.user?.id) return;
    
    await prisma.user.delete({
      where: { id: userId }
    })
    
    revalidatePath('/admin')
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex items-center gap-4">
          <Link href="/instructor">
            <Button variant="secondary">Go to Instructor Dashboard</Button>
          </Link>
          <span>Welcome, {session?.user?.name || session?.user?.email}</span>
          <form action={async () => {
            "use server"
            await signOut({ redirectTo: "/" })
          }}>
            <Button type="submit" variant="outline">Sign Out</Button>
          </form>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">User Management</h2>
        
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user: any) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name || "N/A"}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      user.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                      user.role === 'INSTRUCTOR' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {user.role}
                    </span>
                  </TableCell>
                  <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    {user.id !== session?.user?.id && (
                      <form action={async () => {
                        "use server"
                        await deleteUser(user.id)
                      }}>
                        <Button type="submit" variant="destructive" size="sm">
                          Delete
                        </Button>
                      </form>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
