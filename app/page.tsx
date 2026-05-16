import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import Header from "@/components/Header"
import Calendar from "@/components/Calendar"
import SignIn from "@/components/SignIn"

export default async function Home() {
  const session = await getServerSession(authOptions)

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      {session ? <Calendar /> : <SignIn />}
    </div>
  )
}
