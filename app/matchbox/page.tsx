import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import Header from "@/components/Header"
import MatchboxCollection from "@/components/MatchboxCollection"
import SignIn from "@/components/SignIn"

export default async function MatchboxPage() {
  const session = await getServerSession(authOptions)

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      {session ? <MatchboxCollection /> : <SignIn />}
    </div>
  )
}
