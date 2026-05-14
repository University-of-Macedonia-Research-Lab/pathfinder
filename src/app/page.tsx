import { auth } from "@/auth";
import { HomeContent } from "@/components/home-content";

export default async function HomePage() {
  const session = await auth();
  return <HomeContent isAuthed={Boolean(session?.user)} />;
}
